import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Download, 
  Eye, 
  Star, 
  Check, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import FilePreviewModal from '../components/FilePreviewModal';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSem, setSelectedSem] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [inContent, setInContent] = useState(true);

  const [results, setResults] = useState({ files: [], subjects: [], syllabi: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    executeSearch();
  }, [query, selectedYear, selectedSem, selectedCategory, selectedFileType, inContent]);

  const executeSearch = async () => {
    if (!query && selectedYear === 'all' && selectedSem === 'all' && selectedCategory === 'all' && selectedFileType === 'all') {
      setResults({ files: [], subjects: [], syllabi: [], total: 0 });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedYear !== 'all') params.set('year', selectedYear);
      if (selectedSem !== 'all') params.set('semester', selectedSem);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedFileType !== 'all') params.set('fileType', selectedFileType);
      params.set('inContent', inContent ? 'true' : 'false');

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  const toggleFavorite = async (fileId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/files/${fileId}/toggle-favorite`, { method: 'POST' });
      if (res.ok) {
        executeSearch();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="search-page">
      <Breadcrumb items={[{ label: 'Global Search', path: '/search' }]} />

      {/* Search Header */}
      <div className="semester-hero" style={{ padding: '28px' }}>
        <h1 className="semester-title" style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          Global Study Material Search
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px' }}>
          Search across files, subject names, syllabi units, topics, and indexed document contents
        </p>

        {/* Search Input Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={22} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{
              padding: '14px 20px 14px 50px',
              fontSize: '1.05rem',
              borderRadius: 'var(--radius-lg)'
            }}
            placeholder="Type subject, file name, unit topic, e.g. Mathematics, DAA, Unit 1, Express..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
        </div>

        {/* Content Search Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            id="inContentToggle"
            checked={inContent}
            onChange={e => setInContent(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          <label htmlFor="inContentToggle" style={{ cursor: 'pointer' }}>
            Search inside full file content (PDFs, Word documents, Markdown, Text notes)
          </label>
        </div>
      </div>

      {/* ========================================================
          13. SEARCH FILTERS BAR
          ======================================================== */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.88rem', fontWeight: 600 }}>
          <Filter size={16} />
          <span>Filters:</span>
        </div>

        {/* Year Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          <option value="all">YEAR: All</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </select>

        {/* Semester Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedSem}
          onChange={e => setSelectedSem(e.target.value)}
        >
          <option value="all">SEMESTER: All</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">CATEGORY: All</option>
          <option value="mid-1">MID-1</option>
          <option value="mid-2">MID-2</option>
          <option value="sem">SEM</option>
          <option value="presentation">Presentation</option>
          <option value="records">Records</option>
          <option value="assignments">Assignments</option>
        </select>

        {/* File Type Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
          value={selectedFileType}
          onChange={e => setSelectedFileType(e.target.value)}
        >
          <option value="all">FILE TYPE: All</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX / Word</option>
          <option value="pptx">PPTX / Presentation</option>
          <option value="png">Images</option>
          <option value="mp4">Video</option>
          <option value="txt">Text Notes</option>
        </select>

        {(selectedYear !== 'all' || selectedSem !== 'all' || selectedCategory !== 'all' || selectedFileType !== 'all') && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedYear('all');
              setSelectedSem('all');
              setSelectedCategory('all');
              setSelectedFileType('all');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* SEARCH RESULTS */}
      <div>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem' }}>
            Search Results {loading ? '(Searching...)' : `(${results.total} matches)`}
          </h2>
        </div>

        {/* 1. MATCHING FILES */}
        {results.files.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              Matching Study Files ({results.files.length})
            </h3>

            <div className="files-list-container">
              {results.files.map(file => {
                const ext = file.file_type.toLowerCase();
                return (
                  <div key={file.id} className="file-row">
                    <div className={`file-type-icon ${ext}`}>
                      {ext.toUpperCase().slice(0, 4)}
                    </div>

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
                          style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}
                        >
                          {file.subject_name}
                        </Link>
                        <span>•</span>
                        <span>{formatBytes(file.file_size)}</span>
                      </div>
                    </div>

                    <div className="file-actions">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(file.id, e)}
                        className={`action-icon-btn fav ${file.is_favorite ? 'active' : ''}`}
                        title={file.is_favorite ? 'Favorited' : 'Add to Favorites'}
                      >
                        <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                        <span className="hide-mobile">Open</span>
                      </button>

                      <a
                        href={`/api/files/${file.id}/download`}
                        download={file.original_name}
                        className="btn btn-primary btn-sm"
                      >
                        <Download size={14} />
                        <span className="hide-mobile">Download</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. MATCHING SUBJECTS */}
        {results.subjects.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-emerald)' }} />
              Matching Subjects ({results.subjects.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {results.subjects.map(sub => (
                <div
                  key={sub.id}
                  className="subject-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => window.location.href = `/year/${sub.year_id}/semester/${sub.semester_id}/${sub.category_slug}/${sub.slug}`}
                >
                  <div>
                    {sub.code && <span className="subject-code">{sub.code}</span>}
                    <h4 className="subject-name">{sub.name}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {sub.year_name} • {sub.semester_name} • {sub.category_name}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {sub.file_count} Files
                    </span>
                    <div className="btn btn-secondary btn-sm">
                      <span>View Subject</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MATCHING SYLLABUS TOPICS */}
        {results.syllabi.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-amber)' }} />
              Matching Syllabus Topics & Units ({results.syllabi.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.syllabi.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="unit-badge">Unit {item.unit_number}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.topic_name}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.year_name} • {item.semester_name} • {item.category_name} • <strong>{item.subject_name}</strong>
                    </div>
                  </div>

                  <Link
                    to={`/year/${item.year_id}/semester/${item.semester_id}/${item.category_slug}/${item.subject_slug}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View Syllabus
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && results.total === 0 && (query || selectedYear !== 'all' || selectedSem !== 'all') && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '50px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Search size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
              No matches found for "{query}"
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Try searching with a different keyword, relaxing filters, or browsing by Academic Year.
            </p>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
