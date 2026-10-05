import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  BookOpen, 
  Files, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  Star, 
  Plus, 
  FileText, 
  Search, 
  Filter, 
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import UploadModal from '../components/UploadModal';
import SyllabusEditorModal from '../components/SyllabusEditorModal';
import RenameFileModal from '../components/RenameFileModal';
import FilePreviewModal from '../components/FilePreviewModal';

export default function SubjectPage() {
  const { yearId, semId, categorySlug, subjectSlug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, openLoginPrompt, authFetch } = useAuth();

  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'syllabus'

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [renameTargetFile, setRenameTargetFile] = useState(null);
  const [previewTargetFile, setPreviewTargetFile] = useState(null);

  // Filters within subject files
  const [fileFilterType, setFileFilterType] = useState('all');
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  useEffect(() => {
    fetchSubjectData();
  }, [semId, categorySlug, subjectSlug]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      // Fast lookup
      const lookupRes = await fetch(`/api/lookup?yearId=${yearId}&semNumber=${semId}&categorySlug=${categorySlug}&subjectSlug=${subjectSlug}`);
      const lookup = await lookupRes.json();

      let subId = lookup?.subject?.id;

      if (!subId) {
        // Fallback by traversing semester
        const semRes = await fetch(`/api/semesters/${semId}`);
        const semJson = await semRes.json();
        const matchedCat = semJson.categories.find(c => c.slug === categorySlug);
        if (matchedCat) {
          const catRes = await fetch(`/api/categories/${matchedCat.id}`);
          const catJson = await catRes.json();
          const matchedSub = catJson.subjects.find(s => s.slug === subjectSlug);
          if (matchedSub) subId = matchedSub.id;
        }
      }

      if (!subId) throw new Error('Subject not found');

      const res = await fetch(`/api/subjects/${subId}`);
      if (!res.ok) throw new Error('Subject details could not be retrieved');
      const data = await res.json();

      setSubjectData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to upload study materials.');
      return;
    }
    setShowUploadModal(true);
  };

  const handleSyllabusEditClick = () => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to edit or import syllabus.');
      return;
    }
    setShowSyllabusModal(true);
  };

  const handleRenameClick = (file) => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to rename files.');
      return;
    }
    setRenameTargetFile(file);
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to delete files.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete file "${fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSubjectData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (fileId) => {
    try {
      const res = await fetch(`/api/files/${fileId}/toggle-favorite`, { method: 'POST' });
      if (res.ok) {
        fetchSubjectData();
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

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading subject workstation...
      </div>
    );
  }

  if (!subjectData) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Subject Not Found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: subjectData.year_name, path: `/year/${subjectData.year_id}` },
    { label: subjectData.semester_name, path: `/year/${subjectData.year_id}/semester/${subjectData.semester_id}` },
    { label: subjectData.category_name, path: `/year/${subjectData.year_id}/semester/${subjectData.semester_id}/${subjectData.category_slug}` },
    { label: subjectData.name, path: `/year/${subjectData.year_id}/semester/${subjectData.semester_id}/${subjectData.category_slug}/${subjectData.slug}` }
  ];

  // Filter files
  const filteredFiles = (subjectData.files || []).filter(f => {
    const matchesSearch = f.original_name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (fileFilterType === 'all') return true;
    const ext = f.file_type.toLowerCase();
    if (fileFilterType === 'pdf') return ext === 'pdf';
    if (fileFilterType === 'doc') return ['doc', 'docx'].includes(ext);
    if (fileFilterType === 'ppt') return ['ppt', 'pptx'].includes(ext);
    if (fileFilterType === 'image') return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    if (fileFilterType === 'video') return ['mp4', 'webm', 'ogg', 'mkv'].includes(ext);
    if (fileFilterType === 'text') return ['txt', 'md', 'csv', 'json', 'py', 'js'].includes(ext);
    return true;
  });

  return (
    <div className="subject-workstation">
      <Breadcrumb items={breadcrumbs} />

      {/* Subject Header Banner */}
      <div className="semester-hero" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="unit-badge">
                {subjectData.year_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {subjectData.semester_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                {subjectData.category_name}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="semester-title" style={{ fontSize: '2rem', marginBottom: 0 }}>
                {subjectData.name}
              </h1>
              {subjectData.code && (
                <span className="subject-code" style={{ fontSize: '0.9rem', padding: '4px 10px', marginBottom: 0 }}>
                  {subjectData.code}
                </span>
              )}
            </div>

            {subjectData.description && (
              <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.95rem', maxWidth: '700px' }}>
                {subjectData.description}
              </p>
            )}
          </div>

          {/* Top Actions: + ADD FILE and SYLLABUS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUploadClick}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <UploadCloud size={18} />
              <span>+ ADD FILE</span>
            </button>

            <button
              type="button"
              onClick={handleSyllabusEditClick}
              className="btn btn-secondary"
              style={{ gap: '8px' }}
            >
              <BookOpen size={18} />
              <span>📚 SYLLABUS EDITOR</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Materials vs Syllabus */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'files' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
            onClick={() => setActiveTab('files')}
          >
            <Files size={15} />
            <span>Study Materials ({subjectData.files?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'syllabus' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
            onClick={() => setActiveTab('syllabus')}
          >
            <BookOpen size={15} />
            <span>Structured Syllabus ({subjectData.syllabus?.units?.length || 0} Units)</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: STUDY MATERIALS / FILES
          ======================================================== */}
      {activeTab === 'files' && (
        <div>
          {/* Controls Bar: Search & Format Filters */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter files by name..."
                value={fileSearchQuery}
                onChange={e => setFileSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Format Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {['all', 'pdf', 'doc', 'ppt', 'image', 'video', 'text'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFileFilterType(fmt)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: fileFilterType === fmt ? 'var(--primary)' : 'var(--border-subtle)',
                    background: fileFilterType === fmt ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: fileFilterType === fmt ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleUploadClick}
              className="btn btn-primary btn-sm"
            >
              <UploadCloud size={14} />
              <span>+ Add File</span>
            </button>
          </div>

          {/* Files List */}
          {filteredFiles.length > 0 ? (
            <div className="files-list-container">
              {filteredFiles.map((file) => {
                const ext = file.file_type.toLowerCase();
                return (
                  <div key={file.id} className="file-row">
                    {/* File Icon */}
                    <div className={`file-type-icon ${ext}`}>
                      {ext.toUpperCase().slice(0, 4)}
                    </div>

                    {/* File Information */}
                    <div className="file-info">
                      <div 
                        className="file-name" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setPreviewTargetFile(file)}
                        title={file.original_name}
                      >
                        {file.original_name}
                      </div>

                      <div className="file-meta-tags">
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {file.file_type.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{formatBytes(file.file_size)}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="unit-badge" style={{ fontSize: '0.7rem' }}>
                          {subjectData.category_name}
                        </span>
                      </div>
                    </div>

                    {/* 8. FILE ACTIONS: OPEN, DOWNLOAD, DELETE, RENAME, FAVORITE */}
                    <div className="file-actions">
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(file.id)}
                        className={`action-icon-btn fav ${file.is_favorite ? 'active' : ''}`}
                        title={file.is_favorite ? 'Favorited' : 'Add to Favorites'}
                      >
                        <Star size={16} fill={file.is_favorite ? 'currentColor' : 'none'} />
                      </button>

                      {/* OPEN Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewTargetFile(file)}
                        className="btn btn-secondary btn-sm"
                        title="Open file preview"
                      >
                        <Eye size={14} />
                        <span className="hide-mobile">Open</span>
                      </button>

                      {/* DOWNLOAD */}
                      <a
                        href={`/api/files/${file.id}/download`}
                        download={file.original_name}
                        className="btn btn-primary btn-sm"
                        title="Download file"
                      >
                        <Download size={14} />
                        <span className="hide-mobile">Download</span>
                      </a>

                      {/* RENAME */}
                      <button
                        type="button"
                        onClick={() => handleRenameClick(file)}
                        className="action-icon-btn"
                        title="Rename file"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id, file.original_name)}
                        className="action-icon-btn"
                        style={{ color: 'var(--accent-rose)' }}
                        title="Delete file"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <UploadCloud size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                No Files Found
              </h3>
              <p style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                Upload notes, PDFs, question banks, or documents for {subjectData.name}
              </p>
              <button
                type="button"
                onClick={handleUploadClick}
                className="btn btn-primary"
              >
                <UploadCloud size={16} />
                + ADD FILE
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: STRUCTURED SYLLABUS
          ======================================================== */}
      {activeTab === 'syllabus' && (
        <div className="syllabus-container">
          <div className="syllabus-header">
            <div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>
                {subjectData.syllabus?.title || `${subjectData.name} Syllabus`}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Structured course syllabus broken down by Units and Topics
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSyllabusEditClick}
                className="btn btn-primary btn-sm"
              >
                <Edit3 size={15} />
                <span>Edit / Import Syllabus</span>
              </button>
            </div>
          </div>

          {subjectData.syllabus?.units && subjectData.syllabus.units.length > 0 ? (
            <div className="units-stack">
              {subjectData.syllabus.units.map((unit) => (
                <div key={unit.id} className="unit-card">
                  <div className="unit-header">
                    <div className="unit-title-text">
                      <span className="unit-badge">Unit {unit.unit_number}</span>
                      <span>{unit.title}</span>
                    </div>
                  </div>

                  {unit.topics && unit.topics.length > 0 ? (
                    <ul className="topics-list">
                      {unit.topics.map((t) => (
                        <li key={t.id} className="topic-item">
                          <div className="topic-item-left">
                            <span className="topic-bullet" />
                            <span>{t.topic_name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', paddingLeft: '8px' }}>
                      No topics added for this unit yet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: 'var(--text-main)' }}>
                No Syllabus Structured Yet
              </h3>
              <p style={{ marginBottom: '18px', fontSize: '0.9rem' }}>
                Add units and topics or import the official syllabus curriculum
              </p>
              <button
                type="button"
                onClick={handleSyllabusEditClick}
                className="btn btn-primary"
              >
                <Plus size={16} />
                + ADD SYLLABUS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          subjectId={subjectData.id}
          subjectName={subjectData.name}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => fetchSubjectData()}
        />
      )}

      {showSyllabusModal && (
        <SyllabusEditorModal
          subjectId={subjectData.id}
          subjectName={subjectData.name}
          initialSyllabus={subjectData.syllabus}
          onClose={() => setShowSyllabusModal(false)}
          onSaveSuccess={() => fetchSubjectData()}
        />
      )}

      {renameTargetFile && (
        <RenameFileModal
          file={renameTargetFile}
          onClose={() => setRenameTargetFile(null)}
          onSuccess={() => fetchSubjectData()}
        />
      )}

      {previewTargetFile && (
        <FilePreviewModal
          file={previewTargetFile}
          onClose={() => setPreviewTargetFile(null)}
        />
      )}
    </div>
  );
}
