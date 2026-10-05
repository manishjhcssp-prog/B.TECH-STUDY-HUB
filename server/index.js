const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const crypto = require('crypto');
const { db, initDb, hashPassword, verifyPassword } = require('./db');
const { runImporter, MATERIALS_ROOT, slugify, getMimeType } = require('./importer');
const { extractTextFromFile } = require('./textExtractor');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
fs.mkdirSync(MATERIALS_ROOT, { recursive: true });

// Configure Multer storage
const tempUploadDir = path.join(__dirname, '..', 'temp_uploads');
fs.mkdirSync(tempUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^\w\.\-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max per file
});

// ==================== AUTHENTICATION MIDDLEWARE ====================
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin login required for this operation.' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.prepare(`
    SELECT a.id, a.username 
    FROM admin_tokens t 
    JOIN admins a ON t.admin_id = a.id 
    WHERE t.token = ?
  `).get(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session. Please log in again.' });
  }

  req.admin = session;
  next();
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)').get(username.trim());
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid admin username or password' });
    }

    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO admin_tokens (token, admin_id) VALUES (?, ?)').run(token, admin.id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ isAdmin: false });
  }

  const token = authHeader.split(' ')[1];
  const session = db.prepare(`
    SELECT a.id, a.username 
    FROM admin_tokens t 
    JOIN admins a ON t.admin_id = a.id 
    WHERE t.token = ?
  `).get(token);

  if (!session) {
    return res.json({ isAdmin: false });
  }

  res.json({
    isAdmin: true,
    admin: session
  });
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      db.prepare('DELETE FROM admin_tokens WHERE token = ?').run(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update credentials (Admin only)
app.post('/api/auth/change-credentials', requireAdmin, (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
    if (!verifyPassword(currentPassword, admin.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    let updatedUsername = admin.username;
    if (newUsername && newUsername.trim()) {
      updatedUsername = newUsername.trim();
    }

    let updatedHash = admin.password_hash;
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters' });
      }
      updatedHash = hashPassword(newPassword.trim());
    }

    db.prepare('UPDATE admins SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(updatedUsername, updatedHash, admin.id);

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      username: updatedUsername
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD / STATS (PUBLIC) ====================
app.get('/api/stats', (req, res) => {
  try {
    const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
    const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
    const totalSyllabi = db.prepare('SELECT COUNT(*) as count FROM syllabus').get().count;
    const totalSemesters = db.prepare('SELECT COUNT(*) as count FROM semesters').get().count;
    const totalFavorites = db.prepare('SELECT COUNT(*) as count FROM files WHERE is_favorite = 1').get().count;

    const recentFiles = db.prepare(`
      SELECT 
        f.id, f.original_name, f.file_type, f.file_size, f.created_at, f.is_favorite,
        s.id as subject_id, s.name as subject_name, s.slug as subject_slug,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name
      FROM files f
      JOIN subjects s ON f.subject_id = s.id
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      totalFiles,
      totalSubjects,
      totalSyllabi,
      totalSemesters,
      totalFavorites,
      recentFiles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== YEARS (PUBLIC) ====================
app.get('/api/years', (req, res) => {
  try {
    const years = db.prepare('SELECT * FROM years ORDER BY display_order ASC').all();
    
    const enriched = years.map(year => {
      const semesters = db.prepare(`
        SELECT s.*, 
          (SELECT COUNT(*) FROM categories c WHERE c.semester_id = s.id) as category_count,
          (SELECT COUNT(*) FROM subjects sub JOIN categories c ON sub.category_id = c.id WHERE c.semester_id = s.id) as subject_count,
          (SELECT COUNT(*) FROM files f JOIN subjects sub ON f.subject_id = sub.id JOIN categories c ON sub.category_id = c.id WHERE c.semester_id = s.id) as file_count
        FROM semesters s
        WHERE s.year_id = ?
        ORDER BY s.sem_number ASC
      `).all(year.id);

      const totalYearFiles = semesters.reduce((acc, sem) => acc + sem.file_count, 0);
      const totalYearSubjects = semesters.reduce((acc, sem) => acc + sem.subject_count, 0);

      return {
        ...year,
        semesters,
        totalFiles: totalYearFiles,
        totalSubjects: totalYearSubjects
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/years/:yearId', (req, res) => {
  try {
    const year = db.prepare('SELECT * FROM years WHERE id = ?').get(req.params.yearId);
    if (!year) return res.status(404).json({ error: 'Year not found' });

    const semesters = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM categories c WHERE c.semester_id = s.id) as category_count,
        (SELECT COUNT(*) FROM subjects sub JOIN categories c ON sub.category_id = c.id WHERE c.semester_id = s.id) as subject_count,
        (SELECT COUNT(*) FROM files f JOIN subjects sub ON f.subject_id = sub.id JOIN categories c ON sub.category_id = c.id WHERE c.semester_id = s.id) as file_count
      FROM semesters s
      WHERE s.year_id = ?
      ORDER BY s.sem_number ASC
    `).all(year.id);

    res.json({ ...year, semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SEMESTERS & CATEGORIES ====================
app.get('/api/semesters/:semId', (req, res) => {
  try {
    const sem = db.prepare(`
      SELECT s.*, y.name as year_name, y.id as year_id
      FROM semesters s
      JOIN years y ON s.year_id = y.id
      WHERE s.id = ?
    `).get(req.params.semId);

    if (!sem) return res.status(404).json({ error: 'Semester not found' });

    const categories = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM subjects sub WHERE sub.category_id = c.id) as subject_count,
        (SELECT COUNT(*) FROM files f JOIN subjects sub ON f.subject_id = sub.id WHERE sub.category_id = c.id) as file_count
      FROM categories c
      WHERE c.semester_id = ?
      ORDER BY c.display_order ASC, c.id ASC
    `).all(sem.id);

    res.json({ ...sem, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Category (ADMIN ONLY)
app.post('/api/semesters/:semId/categories', requireAdmin, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    const semId = req.params.semId;
    const catSlug = slugify(name);

    const existing = db.prepare('SELECT id FROM categories WHERE semester_id = ? AND slug = ?').get(semId, catSlug);
    if (existing) return res.status(400).json({ error: 'Category already exists in this semester' });

    const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM categories WHERE semester_id = ?').get(semId).m || 0;
    const result = db.prepare(`
      INSERT INTO categories (semester_id, name, slug, is_default, display_order)
      VALUES (?, ?, ?, 0, ?)
    `).run(semId, name.trim(), catSlug, maxOrder + 1);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Category (ADMIN ONLY)
app.delete('/api/categories/:catId', requireAdmin, (req, res) => {
  try {
    const catId = req.params.catId;
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(catId);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    if (cat.is_default) return res.status(400).json({ error: 'Default categories cannot be deleted' });

    db.prepare('DELETE FROM categories WHERE id = ?').run(catId);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CATEGORY DETAILS & SUBJECTS ====================
app.get('/api/categories/:catId', (req, res) => {
  try {
    const category = db.prepare(`
      SELECT c.*, sem.id as semester_id, sem.sem_number, sem.name as semester_name,
             y.id as year_id, y.name as year_name
      FROM categories c
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE c.id = ?
    `).get(req.params.catId);

    if (!category) return res.status(404).json({ error: 'Category not found' });

    const subjects = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM files f WHERE f.subject_id = s.id) as file_count,
        (SELECT COUNT(*) FROM syllabus syl WHERE syl.subject_id = s.id) as has_syllabus
      FROM subjects s
      WHERE s.category_id = ?
      ORDER BY s.name ASC
    `).all(category.id);

    res.json({ ...category, subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Subject (ADMIN ONLY)
app.post('/api/categories/:catId/subjects', requireAdmin, (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });

    const catId = req.params.catId;
    const subSlug = slugify(name);

    const existing = db.prepare('SELECT id FROM subjects WHERE category_id = ? AND slug = ?').get(catId, subSlug);
    if (existing) return res.status(400).json({ error: 'Subject already exists in this section' });

    const result = db.prepare(`
      INSERT INTO subjects (category_id, name, code, slug, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(catId, name.trim(), code ? code.trim() : '', subSlug, description ? description.trim() : '');

    const newSubId = result.lastInsertRowid;

    db.prepare('INSERT INTO syllabus (subject_id, title) VALUES (?, ?)').run(newSubId, `${name.trim()} Syllabus`);

    const created = db.prepare('SELECT * FROM subjects WHERE id = ?').get(newSubId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Subject (ADMIN ONLY)
app.put('/api/subjects/:subId', requireAdmin, (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });

    const subId = req.params.subId;
    const subSlug = slugify(name);

    db.prepare(`
      UPDATE subjects 
      SET name = ?, code = ?, slug = ?, description = ?
      WHERE id = ?
    `).run(name.trim(), code ? code.trim() : '', subSlug, description ? description.trim() : '', subId);

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Subject (ADMIN ONLY)
app.delete('/api/subjects/:subId', requireAdmin, (req, res) => {
  try {
    const subId = req.params.subId;
    const sub = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subId);
    if (!sub) return res.status(404).json({ error: 'Subject not found' });

    db.prepare('DELETE FROM subjects WHERE id = ?').run(subId);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SUBJECT DETAILS & FILES (PUBLIC) ====================
app.get('/api/subjects/:subId', (req, res) => {
  try {
    const subject = db.prepare(`
      SELECT s.*, 
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name
      FROM subjects s
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE s.id = ?
    `).get(req.params.subId);

    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const files = db.prepare(`
      SELECT * FROM files 
      WHERE subject_id = ?
      ORDER BY created_at DESC
    `).all(subject.id);

    let syllabus = db.prepare('SELECT * FROM syllabus WHERE subject_id = ?').get(subject.id);
    if (syllabus) {
      const units = db.prepare('SELECT * FROM units WHERE syllabus_id = ? ORDER BY unit_number ASC, display_order ASC').all(syllabus.id);
      for (const u of units) {
        u.topics = db.prepare('SELECT * FROM topics WHERE unit_id = ? ORDER BY display_order ASC, id ASC').all(u.id);
      }
      syllabus.units = units;
    }

    res.json({
      ...subject,
      files,
      syllabus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SYLLABUS OPERATIONS ====================
app.get('/api/subjects/:subId/syllabus', (req, res) => {
  try {
    const subId = req.params.subId;
    let syllabus = db.prepare('SELECT * FROM syllabus WHERE subject_id = ?').get(subId);

    if (!syllabus) {
      const sub = db.prepare('SELECT name FROM subjects WHERE id = ?').get(subId);
      if (!sub) return res.status(404).json({ error: 'Subject not found' });
      const insert = db.prepare('INSERT INTO syllabus (subject_id, title) VALUES (?, ?)').run(subId, `${sub.name} Syllabus`);
      syllabus = db.prepare('SELECT * FROM syllabus WHERE id = ?').get(insert.lastInsertRowid);
    }

    const units = db.prepare('SELECT * FROM units WHERE syllabus_id = ? ORDER BY unit_number ASC, display_order ASC').all(syllabus.id);
    for (const u of units) {
      u.topics = db.prepare('SELECT * FROM topics WHERE unit_id = ? ORDER BY display_order ASC, id ASC').all(u.id);
    }
    syllabus.units = units;

    res.json(syllabus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Syllabus (ADMIN ONLY)
app.post('/api/subjects/:subId/syllabus/save', requireAdmin, (req, res) => {
  try {
    const subId = req.params.subId;
    const { title, description, units } = req.body;

    let syllabus = db.prepare('SELECT id FROM syllabus WHERE subject_id = ?').get(subId);
    let syllabusId;

    if (syllabus) {
      syllabusId = syllabus.id;
      db.prepare('UPDATE syllabus SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(title || 'Subject Syllabus', description || '', syllabusId);
    } else {
      const insert = db.prepare('INSERT INTO syllabus (subject_id, title, description) VALUES (?, ?, ?)')
        .run(subId, title || 'Subject Syllabus', description || '');
      syllabusId = insert.lastInsertRowid;
    }

    const updateTransaction = db.transaction(() => {
      db.prepare('DELETE FROM units WHERE syllabus_id = ?').run(syllabusId);

      if (Array.isArray(units)) {
        const insertUnit = db.prepare('INSERT INTO units (syllabus_id, unit_number, title, display_order) VALUES (?, ?, ?, ?)');
        const insertTopic = db.prepare('INSERT INTO topics (unit_id, topic_name, display_order) VALUES (?, ?, ?)');

        let uIdx = 1;
        for (const u of units) {
          const uRes = insertUnit.run(syllabusId, u.unitNumber || uIdx, u.title || `UNIT ${uIdx}`, uIdx);
          const unitId = uRes.lastInsertRowid;
          uIdx++;

          if (Array.isArray(u.topics)) {
            let tIdx = 1;
            for (const t of u.topics) {
              const topicName = typeof t === 'string' ? t : (t.topic_name || t.name);
              if (topicName && topicName.trim()) {
                insertTopic.run(unitId, topicName.trim(), tIdx++);
              }
            }
          }
        }
      }
    });

    updateTransaction();

    const savedSyllabus = db.prepare('SELECT * FROM syllabus WHERE id = ?').get(syllabusId);
    const savedUnits = db.prepare('SELECT * FROM units WHERE syllabus_id = ? ORDER BY unit_number ASC').all(syllabusId);
    for (const u of savedUnits) {
      u.topics = db.prepare('SELECT * FROM topics WHERE unit_id = ? ORDER BY display_order ASC').all(u.id);
    }
    savedSyllabus.units = savedUnits;

    res.json(savedSyllabus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unit & Topic operations (ADMIN ONLY)
app.post('/api/syllabus/:syllabusId/units', requireAdmin, (req, res) => {
  try {
    const { title, unitNumber } = req.body;
    const syllabusId = req.params.syllabusId;
    const maxUnit = db.prepare('SELECT MAX(unit_number) as m FROM units WHERE syllabus_id = ?').get(syllabusId).m || 0;
    const nextNum = unitNumber || (maxUnit + 1);

    const result = db.prepare('INSERT INTO units (syllabus_id, unit_number, title, display_order) VALUES (?, ?, ?, ?)')
      .run(syllabusId, nextNum, title || `UNIT ${nextNum}`, nextNum);

    const created = db.prepare('SELECT * FROM units WHERE id = ?').get(result.lastInsertRowid);
    created.topics = [];
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/units/:unitId', requireAdmin, (req, res) => {
  try {
    const { title, unitNumber } = req.body;
    db.prepare('UPDATE units SET title = ?, unit_number = ? WHERE id = ?')
      .run(title, unitNumber || 1, req.params.unitId);
    const updated = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.unitId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/units/:unitId', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM units WHERE id = ?').run(req.params.unitId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/units/:unitId/topics', requireAdmin, (req, res) => {
  try {
    const { topicName } = req.body;
    if (!topicName || !topicName.trim()) return res.status(400).json({ error: 'Topic name required' });

    const unitId = req.params.unitId;
    const maxOrder = db.prepare('SELECT MAX(display_order) as m FROM topics WHERE unit_id = ?').get(unitId).m || 0;

    const result = db.prepare('INSERT INTO topics (unit_id, topic_name, display_order) VALUES (?, ?, ?)')
      .run(unitId, topicName.trim(), maxOrder + 1);

    const created = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/topics/:topicId', requireAdmin, (req, res) => {
  try {
    const { topicName } = req.body;
    db.prepare('UPDATE topics SET topic_name = ? WHERE id = ?').run(topicName.trim(), req.params.topicId);
    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.topicId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/topics/:topicId', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.topicId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FILE UPLOAD (ADMIN ONLY) ====================
app.post('/api/subjects/:subId/files/upload', requireAdmin, upload.array('files', 15), async (req, res) => {
  try {
    const subId = req.params.subId;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const subjectInfo = db.prepare(`
      SELECT s.slug as sub_slug, c.slug as cat_slug, sem.sem_number, y.id as year_id
      FROM subjects s
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE s.id = ?
    `).get(subId);

    if (!subjectInfo) {
      req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(404).json({ error: 'Subject not found' });
    }

    const targetDir = path.join(
      MATERIALS_ROOT,
      `year-${subjectInfo.year_id}`,
      `semester-${subjectInfo.sem_number}`,
      subjectInfo.cat_slug,
      subjectInfo.sub_slug
    );
    fs.mkdirSync(targetDir, { recursive: true });

    const savedFiles = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
      const safeStoredName = `${Date.now()}-${file.originalname.replace(/[^\w\.\-]/g, '_')}`;
      const finalFilePath = path.join(targetDir, safeStoredName);

      fs.renameSync(file.path, finalFilePath);

      const relPath = path.relative(MATERIALS_ROOT, finalFilePath).replace(/\\/g, '/');

      let contentText = '';
      try {
        contentText = await extractTextFromFile(finalFilePath, ext);
      } catch (err) {
        console.warn('Text extraction failed for', file.originalname, err);
      }

      const mimeType = file.mimetype || getMimeType(ext);

      const result = db.prepare(`
        INSERT INTO files (subject_id, original_name, stored_name, file_path, file_type, mime_type, file_size, is_favorite, content_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(subId, file.originalname, safeStoredName, relPath, ext, mimeType, file.size, contentText);

      const saved = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);
      savedFiles.push(saved);
    }

    res.status(201).json({
      success: true,
      files: savedFiles
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stream / Preview file in browser (PUBLIC)
app.get('/api/files/:fileId/preview', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const fullPath = path.join(MATERIALS_ROOT, file.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Physical file not found on disk' });

    const ext = file.file_type.toLowerCase();
    const contentType = file.mime_type || mime.lookup(fullPath) || 'application/octet-stream';

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(fullPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.original_name)}"`,
        'Cache-Control': 'public, max-age=3600'
      });
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download file (PUBLIC)
app.get('/api/files/:fileId/download', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const fullPath = path.join(MATERIALS_ROOT, file.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Physical file not found on disk' });

    res.download(fullPath, file.original_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rename file (ADMIN ONLY)
app.patch('/api/files/:fileId/rename', requireAdmin, (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName || !newName.trim()) return res.status(400).json({ error: 'New file name is required' });

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    let finalName = newName.trim();
    const origExt = path.extname(file.original_name);
    if (!path.extname(finalName) && origExt) {
      finalName += origExt;
    }

    db.prepare('UPDATE files SET original_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(finalName, file.id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(file.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file (ADMIN ONLY)
app.delete('/api/files/:fileId', requireAdmin, (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const fullPath = path.join(MATERIALS_ROOT, file.file_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        console.warn('Could not delete physical file:', e.message);
      }
    }

    db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Favorite (PUBLIC)
app.post('/api/files/:fileId/toggle-favorite', (req, res) => {
  try {
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const newFav = file.is_favorite ? 0 : 1;
    db.prepare('UPDATE files SET is_favorite = ? WHERE id = ?').run(newFav, file.id);

    const updated = db.prepare('SELECT * FROM files WHERE id = ?').get(file.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Favorites (PUBLIC)
app.get('/api/favorites', (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT 
        f.*,
        s.id as subject_id, s.name as subject_name, s.slug as subject_slug,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name
      FROM files f
      JOIN subjects s ON f.subject_id = s.id
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE f.is_favorite = 1
      ORDER BY f.created_at DESC
    `).all();

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Search (PUBLIC)
app.get('/api/search', (req, res) => {
  try {
    const { q, year, semester, category, fileType, subject, inContent } = req.query;

    const queryTerm = (q || '').trim();
    if (!queryTerm && !year && !semester && !category && !fileType && !subject) {
      return res.json({ files: [], subjects: [], syllabi: [], total: 0 });
    }

    const likeTerm = `%${queryTerm}%`;

    let fileSql = `
      SELECT 
        f.id, f.original_name, f.file_type, f.file_size, f.created_at, f.is_favorite, f.file_path,
        s.id as subject_id, s.name as subject_name, s.slug as subject_slug,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name
      FROM files f
      JOIN subjects s ON f.subject_id = s.id
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE 1=1
    `;
    const fileParams = [];

    if (queryTerm) {
      if (inContent === 'false') {
        fileSql += ` AND (f.original_name LIKE ? OR s.name LIKE ? OR c.name LIKE ?)`;
        fileParams.push(likeTerm, likeTerm, likeTerm);
      } else {
        fileSql += ` AND (f.original_name LIKE ? OR s.name LIKE ? OR c.name LIKE ? OR f.content_text LIKE ?)`;
        fileParams.push(likeTerm, likeTerm, likeTerm, likeTerm);
      }
    }

    if (year && year !== 'all') {
      fileSql += ` AND y.id = ?`;
      fileParams.push(parseInt(year, 10));
    }
    if (semester && semester !== 'all') {
      fileSql += ` AND sem.sem_number = ?`;
      fileParams.push(parseInt(semester, 10));
    }
    if (category && category !== 'all') {
      fileSql += ` AND (c.slug = ? OR c.name LIKE ?)`;
      fileParams.push(category, `%${category}%`);
    }
    if (fileType && fileType !== 'all') {
      fileSql += ` AND LOWER(f.file_type) = ?`;
      fileParams.push(fileType.toLowerCase());
    }
    if (subject && subject !== 'all') {
      fileSql += ` AND (s.slug = ? OR s.name LIKE ?)`;
      fileParams.push(subject, `%${subject}%`);
    }

    fileSql += ` ORDER BY f.created_at DESC LIMIT 60`;
    const files = db.prepare(fileSql).all(...fileParams);

    let subjectSql = `
      SELECT 
        s.id, s.name, s.code, s.slug, s.description,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name,
        (SELECT COUNT(*) FROM files f WHERE f.subject_id = s.id) as file_count
      FROM subjects s
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE 1=1
    `;
    const subjectParams = [];

    if (queryTerm) {
      subjectSql += ` AND (s.name LIKE ? OR s.code LIKE ? OR s.description LIKE ?)`;
      subjectParams.push(likeTerm, likeTerm, likeTerm);
    }
    if (year && year !== 'all') {
      subjectSql += ` AND y.id = ?`;
      subjectParams.push(parseInt(year, 10));
    }
    if (semester && semester !== 'all') {
      subjectSql += ` AND sem.sem_number = ?`;
      subjectParams.push(parseInt(semester, 10));
    }
    if (category && category !== 'all') {
      subjectSql += ` AND c.slug = ?`;
      subjectParams.push(category);
    }

    subjectSql += ` ORDER BY s.name ASC LIMIT 25`;
    const subjects = db.prepare(subjectSql).all(...subjectParams);

    let syllabusSql = `
      SELECT 
        syl.id as syllabus_id, syl.title as syllabus_title,
        u.unit_number, u.title as unit_title,
        t.topic_name,
        s.id as subject_id, s.name as subject_name, s.slug as subject_slug,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        sem.id as semester_id, sem.sem_number, sem.name as semester_name,
        y.id as year_id, y.name as year_name
      FROM topics t
      JOIN units u ON t.unit_id = u.id
      JOIN syllabus syl ON u.syllabus_id = syl.id
      JOIN subjects s ON syl.subject_id = s.id
      JOIN categories c ON s.category_id = c.id
      JOIN semesters sem ON c.semester_id = sem.id
      JOIN years y ON sem.year_id = y.id
      WHERE 1=1
    `;
    const syllabusParams = [];

    if (queryTerm) {
      syllabusSql += ` AND (t.topic_name LIKE ? OR u.title LIKE ? OR syl.title LIKE ?)`;
      syllabusParams.push(likeTerm, likeTerm, likeTerm);
    }
    if (year && year !== 'all') {
      syllabusSql += ` AND y.id = ?`;
      syllabusParams.push(parseInt(year, 10));
    }
    if (semester && semester !== 'all') {
      syllabusSql += ` AND sem.sem_number = ?`;
      syllabusParams.push(parseInt(semester, 10));
    }

    syllabusSql += ` LIMIT 30`;
    const syllabi = db.prepare(syllabusSql).all(...syllabusParams);

    res.json({
      files,
      subjects,
      syllabi,
      total: files.length + subjects.length + syllabi.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast Lookup
app.get('/api/lookup', (req, res) => {
  try {
    const { yearId, semNumber, categorySlug, subjectSlug } = req.query;
    const data = {};

    if (yearId) {
      data.year = db.prepare('SELECT * FROM years WHERE id = ?').get(yearId);
    }
    if (semNumber) {
      data.semester = db.prepare('SELECT * FROM semesters WHERE sem_number = ?').get(semNumber);
    }
    if (data.semester && categorySlug) {
      data.category = db.prepare('SELECT * FROM categories WHERE semester_id = ? AND slug = ?')
        .get(data.semester.id, categorySlug);
    }
    if (data.category && subjectSlug) {
      data.subject = db.prepare('SELECT * FROM subjects WHERE category_id = ? AND slug = ?')
        .get(data.category.id, subjectSlug);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/study-materials')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

async function startServer() {
  await runImporter();
  app.listen(PORT, () => {
    console.log(`B.Tech Study Hub Backend running on http://localhost:${PORT}`);
  });
}

startServer();

