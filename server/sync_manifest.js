const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { db } = require('./db');
const { extractTextFromFile } = require('./textExtractor');

const MATERIALS_ROOT = path.join(__dirname, '..', 'study-materials');
const MANIFEST_PATH = path.join(__dirname, 'downloaded_manifest.json');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMimeType(ext) {
  const map = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    txt: 'text/plain',
    md: 'text/markdown'
  };
  return map[ext] || mime.lookup(ext) || 'application/octet-stream';
}

async function syncManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Manifest file does not exist yet:', MANIFEST_PATH);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  console.log(`Loaded manifest with ${manifest.length} items`);

  // Step 1: Clean up any records or presentation files that might have been seeded previously
  console.log('Cleaning up any records or presentation files...');
  const badFiles = db.prepare(`
    SELECT f.id, f.file_path, f.original_name 
    FROM files f 
    WHERE LOWER(f.original_name) LIKE '%record%' 
       OR LOWER(f.original_name) LIKE '%presentation%'
       OR LOWER(f.original_name) LIKE '%.ppt%'
       OR LOWER(f.file_path) LIKE '%/records/%'
       OR LOWER(f.file_path) LIKE '%/presentation/%'
  `).all();

  for (const bf of badFiles) {
    console.log(`Removing disallowed file from DB: ${bf.original_name} (${bf.file_path})`);
    db.prepare('DELETE FROM files WHERE id = ?').run(bf.id);
    const diskPath = path.join(MATERIALS_ROOT, bf.file_path);
    if (fs.existsSync(diskPath)) {
      try { fs.unlinkSync(diskPath); } catch (e) {}
    }
  }

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < manifest.length; i++) {
    const item = manifest[i];
    const fullPath = path.join(MATERIALS_ROOT, item.rel_path);

    if (!fs.existsSync(fullPath)) {
      console.warn(`File missing on disk: ${fullPath}`);
      skippedCount++;
      continue;
    }

    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      console.warn(`File is 0 bytes: ${fullPath}`);
      skippedCount++;
      continue;
    }

    // 1. Ensure Category exists for semester
    let cat = db.prepare('SELECT * FROM categories WHERE semester_id = ? AND slug = ?').get(item.sem_id, item.cat_slug);
    if (!cat) {
      const order = item.cat_slug === 'mid-1' ? 1 :
                    item.cat_slug === 'mid-2' ? 2 :
                    item.cat_slug === 'sem-1' || item.cat_slug === 'sem-2' || item.cat_slug === 'sem-3' ? 3 :
                    item.cat_slug === 'assignments' ? 4 : 5;
      const res = db.prepare(`
        INSERT INTO categories (semester_id, name, slug, is_default, display_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(item.sem_id, item.cat_name, item.cat_slug, order === 1 ? 1 : 0, order);
      cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(res.lastInsertRowid);
      console.log(`Created Category: [${cat.name}] in Semester ${item.sem_id}`);
    }

    // 2. Ensure Subject exists under Category
    let sub = db.prepare('SELECT * FROM subjects WHERE category_id = ? AND slug = ?').get(cat.id, item.sub_slug);
    if (!sub) {
      // Check if subject exists with same name
      sub = db.prepare('SELECT * FROM subjects WHERE category_id = ? AND LOWER(name) = LOWER(?)').get(cat.id, item.sub_name);
    }

    if (!sub) {
      const res = db.prepare(`
        INSERT INTO subjects (category_id, name, code, slug, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        cat.id,
        item.sub_name,
        item.sub_code,
        item.sub_slug,
        `Comprehensive curriculum study materials, assignments and question banks for ${item.sub_name}.`
      );
      sub = db.prepare('SELECT * FROM subjects WHERE id = ?').get(res.lastInsertRowid);
      console.log(`Created Subject: [${sub.name}] (${sub.code}) in Category [${cat.name}]`);

      // Ensure syllabus record exists
      const existingSyl = db.prepare('SELECT id FROM syllabus WHERE subject_id = ?').get(sub.id);
      if (!existingSyl) {
        db.prepare(`
          INSERT INTO syllabus (subject_id, title, description)
          VALUES (?, ?, ?)
        `).run(sub.id, `${sub.name} Syllabus & Course Objectives`, `Official course syllabus, reference textbooks, and examination guidelines for ${sub.name}.`);
      }
    }

    // 3. Check if file is already in files table
    const existingFile = db.prepare(`
      SELECT * FROM files 
      WHERE subject_id = ? AND (stored_name = ? OR file_path = ?)
    `).get(sub.id, item.stored_name, item.rel_path);

    const ext = path.extname(item.original_name).replace('.', '').toLowerCase();
    const mimeType = getMimeType(ext);
    const isFav = (
      item.original_name.toLowerCase().includes('syllabus') || 
      item.original_name.toLowerCase().includes('important') ||
      item.original_name.toLowerCase().includes('regular')
    ) ? 1 : 0;

    if (!existingFile) {
      // Extract text content for search indexing
      let contentText = '';
      try {
        contentText = await extractTextFromFile(fullPath, ext);
      } catch (err) {
        console.warn(`Text extraction warning for ${item.stored_name}:`, err.message);
      }

      db.prepare(`
        INSERT INTO files (subject_id, original_name, stored_name, file_path, file_type, mime_type, file_size, is_favorite, content_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sub.id,
        item.original_name,
        item.stored_name,
        item.rel_path,
        ext,
        mimeType,
        stats.size,
        isFav,
        contentText
      );

      addedCount++;
      if (addedCount % 10 === 0 || addedCount === 1) {
        console.log(`[${i + 1}/${manifest.length}] Indexed new file: ${item.original_name} -> [${sub.name}] (${(stats.size / 1024).toFixed(1)} KB)`);
      }
    } else {
      // Update size and text if missing
      let contentText = existingFile.content_text;
      if (!contentText || contentText.length < 10) {
        try {
          contentText = await extractTextFromFile(fullPath, ext);
        } catch (e) {}
      }

      db.prepare(`
        UPDATE files 
        SET file_size = ?, mime_type = ?, file_path = ?, content_text = ?, is_favorite = MAX(is_favorite, ?)
        WHERE id = ?
      `).run(stats.size, mimeType, item.rel_path, contentText, isFav, existingFile.id);

      updatedCount++;
    }
  }

  console.log('\n========================================');
  console.log('SYNC COMPLETED SUCCESSFULLY:');
  console.log(`  Added:   ${addedCount}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log(`  Total:   ${manifest.length}`);
  console.log('========================================');

  // Print final database stats
  const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files').get().count;
  const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
  const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  console.log(`Final Database State: ${totalFiles} files across ${totalSubjects} subjects in ${totalCategories} categories.`);
}

syncManifest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
