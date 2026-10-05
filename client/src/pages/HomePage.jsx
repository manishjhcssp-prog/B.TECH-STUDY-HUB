import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Files, 
  BookOpen, 
  FileSpreadsheet, 
  Calendar, 
  Star, 
  ArrowRight, 
  Search, 
  Clock, 
  Download, 
  Eye, 
  Sparkles,
  ChevronRight,
  FileText,
  Layers,
  FolderOpen
} from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, yearsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/years')
      ]);

      const statsData = await statsRes.json();
      const yearsData = await yearsRes.json();

      setStats(statsData);
      setYears(yearsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setLoading(false);
    }
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const toggleFavorite = async (fileId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/files/${fileId}/toggle-favorite`, { method: 'POST' });
      if (res.ok) {
        fetchData(); // refresh stats & recent files
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const quickSearchTags = [
    'Mathematics',
    'DAA',
    'Digital Electronics',
    'Backend Development',
    'Probability & Statistics',
    'Express JS',
    'Question Bank',
    'Unit 1'
  ];

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={16} />
          <span>4-Year Engineering Knowledge Base</span>
        </div>

        <h1 className="hero-title">
          MY B.TECH <span style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>STUDY HUB</span>
        </h1>

        <p className="hero-subtitle">
          Your personal 4-year study repository. Organize lecture notes, question banks, syllabi, and presentation records semester-by-semester.
        </p>

        {/* Big Search Box */}
        <form onSubmit={handleHeroSearch} style={{ maxWidth: '640px', margin: '0 auto 20px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            style={{
              width: '100%',
              padding: '16px 20px 16px 52px',
              fontSize: '1.05rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-md)'
            }}
            placeholder="Search all files, subjects, units, topics, and syllabus..."
            value={heroSearch}
            onChange={(e) => setHeroSearch(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '10px 20px', borderRadius: 'var(--radius-full)' }}
          >
            Search
          </button>
        </form>

        {/* Quick Tag Suggestions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginRight: '4px' }}>Popular:</span>
          {quickSearchTags.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* DASHBOARD STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <Files size={24} />
            </div>
            <div>
              <div className="stat-val">{stats?.totalFiles ?? '...'}</div>
              <div className="stat-label">Study Files</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="stat-val">{stats?.totalSubjects ?? '...'}</div>
              <div className="stat-label">Subjects</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon emerald">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div className="stat-val">{stats?.totalSyllabi ?? '...'}</div>
              <div className="stat-label">Structured Syllabi</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="stat-val">8</div>
              <div className="stat-label">Semesters (4 Years)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          1. MAIN STRUCTURE: FOUR LARGE YEAR BUTTONS
          ======================================================== */}
      <section style={{ marginBottom: '48px' }}>
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>B.Tech Engineering Journey</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Select your academic year to view semesters and categories
            </p>
          </div>
        </div>

        <div className="years-grid">
          {/* YEAR 1 */}
          <div className="year-card year-card-1" onClick={() => navigate('/year/1')}>
            <div>
              <div className="year-header">
                <span className="year-badge-lg">1ST YEAR</span>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Foundations
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Mathematics-I, Applied Physics, C Programming, Digital Electronics, Communication
              </p>
              <div className="year-meta">
                <span>📚 2 Semesters</span>
                <span>•</span>
                <span>📖 10 Subjects</span>
              </div>
            </div>

            <div>
              <div className="year-semesters-list">
                <Link 
                  to="/year/1/semester/1" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 1</span>
                  <ChevronRight size={14} />
                </Link>
                <Link 
                  to="/year/1/semester/2" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 2</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', gap: '6px' }}>
                <span>Open 1st Year</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* YEAR 2 */}
          <div className="year-card year-card-2" onClick={() => navigate('/year/2')}>
            <div>
              <div className="year-header">
                <span className="year-badge-lg">2ND YEAR</span>
                <span style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Active Sem (MRV-25)
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Probability & Stats, DAA Algorithms, Backend Dev, DBMS, OS, Discrete Maths
              </p>
              <div className="year-meta">
                <span>📚 2 Semesters</span>
                <span>•</span>
                <span>🔥 {stats?.totalFiles ? `${stats.totalFiles} Files` : 'Core Subjects'}</span>
              </div>
            </div>

            <div>
              <div className="year-semesters-list">
                <Link 
                  to="/year/2/semester/3" 
                  className="sem-chip" 
                  style={{ borderColor: 'var(--primary)', background: 'var(--primary-light)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 3 ★</span>
                  <ChevronRight size={14} />
                </Link>
                <Link 
                  to="/year/2/semester/4" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 4</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#818cf8', fontWeight: 600, fontSize: '0.9rem', gap: '6px' }}>
                <span>Open 2nd Year</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* YEAR 3 */}
          <div className="year-card year-card-3" onClick={() => navigate('/year/3')}>
            <div>
              <div className="year-header">
                <span className="year-badge-lg">3RD YEAR</span>
                <span style={{ background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Specialization
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Machine Learning, Computer Networks, Software Engineering, AI, Cloud Computing
              </p>
              <div className="year-meta">
                <span>📚 2 Semesters</span>
                <span>•</span>
                <span>📖 10 Subjects</span>
              </div>
            </div>

            <div>
              <div className="year-semesters-list">
                <Link 
                  to="/year/3/semester/5" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 5</span>
                  <ChevronRight size={14} />
                </Link>
                <Link 
                  to="/year/3/semester/6" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 6</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#c084fc', fontWeight: 600, fontSize: '0.9rem', gap: '6px' }}>
                <span>Open 3rd Year</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* YEAR 4 */}
          <div className="year-card year-card-4" onClick={() => navigate('/year/4')}>
            <div>
              <div className="year-header">
                <span className="year-badge-lg">4TH YEAR</span>
                <span style={{ background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700 }}>
                  Capstone & Projects
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Distributed Systems, Deep Learning, Cyber Security, Major Projects & Viva
              </p>
              <div className="year-meta">
                <span>📚 2 Semesters</span>
                <span>•</span>
                <span>🎓 Final Year Prep</span>
              </div>
            </div>

            <div>
              <div className="year-semesters-list">
                <Link 
                  to="/year/4/semester/7" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 7</span>
                  <ChevronRight size={14} />
                </Link>
                <Link 
                  to="/year/4/semester/8" 
                  className="sem-chip" 
                  onClick={e => e.stopPropagation()}
                >
                  <span>SEMESTER 8</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#f472b6', fontWeight: 600, fontSize: '0.9rem', gap: '6px' }}>
                <span>Open 4th Year</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          16 & 17. RECENTLY ADDED STUDY MATERIALS FEED
          ======================================================== */}
      <section>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ background: 'var(--grad-primary)', padding: '6px' }}>
              <Clock size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Recently Added Materials</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Files and notes indexed across your study database
              </p>
            </div>
          </div>
          <Link to="/search" className="btn btn-secondary btn-sm">
            View All Files
          </Link>
        </div>

        {stats?.recentFiles && stats.recentFiles.length > 0 ? (
          <div className="files-list-container">
            {stats.recentFiles.map((file) => {
              const ext = file.file_type.toLowerCase();
              return (
                <div key={file.id} className="file-row">
                  {/* File Type Icon */}
                  <div className={`file-type-icon ${ext}`}>
                    {ext.toUpperCase().slice(0, 4)}
                  </div>

                  {/* File Info */}
                  <div className="file-info">
                    <div 
                      className="file-name" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewFile(file)}
                      title={file.original_name}
                    >
                      {file.original_name}
                    </div>

                    <div className="file-meta-tags">
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {file.year_name}
                      </span>
                      <span>•</span>
                      <span>{file.semester_name}</span>
                      <span>•</span>
                      <span className="unit-badge" style={{ fontSize: '0.72rem' }}>
                        {file.category_name}
                      </span>
                      <span>•</span>
                      <Link 
                        to={`/year/${file.year_id}/semester/${file.semester_id}/${file.category_slug}/${file.subject_slug}`}
                        style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
                        className="hide-mobile"
                      >
                        {file.subject_name}
                      </Link>
                      <span>•</span>
                      <span>{formatBytes(file.file_size)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="file-actions">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(file.id, e)}
                      className={`action-icon-btn fav ${file.is_favorite ? 'active' : ''}`}
                      title={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="btn btn-secondary btn-sm"
                      title="Open file preview"
                    >
                      <Eye size={14} />
                      <span className="hide-mobile">Open</span>
                    </button>

                    <a
                      href={`/api/files/${file.id}/download`}
                      download={file.original_name}
                      className="btn btn-primary btn-sm"
                      title="Download file"
                    >
                      <Download size={14} />
                      <span className="hide-mobile">Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <p>No recent files uploaded yet. Select a semester and subject to add files!</p>
          </div>
        )}
      </section>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
