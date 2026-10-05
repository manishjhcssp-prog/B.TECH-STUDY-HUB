import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Files, 
  Eye, 
  Download, 
  FileText, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import FilePreviewModal from '../components/FilePreviewModal';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/favorites');
      const data = await res.json();
      setFavorites(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const removeFavorite = async (fileId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/files/${fileId}/toggle-favorite`, { method: 'POST' });
      if (res.ok) {
        setFavorites(prev => prev.filter(f => f.id !== fileId));
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
    <div className="favorites-page">
      <Breadcrumb items={[{ label: 'Starred Favorites', path: '/favorites' }]} />

      <div className="semester-hero" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div className="brand-badge" style={{ background: 'var(--grad-amber)' }}>
            <Star size={24} fill="#ffffff" />
          </div>
          <div>
            <h1 className="semester-title" style={{ fontSize: '1.8rem', marginBottom: 0 }}>
              Starred Favorites
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Quick access to your most important study materials across all 4 years
            </p>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 style={{ fontSize: '1.25rem' }}>
          Saved Documents ({favorites.length})
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading favorites...
        </div>
      ) : favorites.length > 0 ? (
        <div className="files-list-container">
          {favorites.map((file) => {
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
                    onClick={(e) => removeFavorite(file.id, e)}
                    className="action-icon-btn fav active"
                    title="Remove from favorites"
                  >
                    <Star size={16} fill="currentColor" />
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
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Star size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            No Favorites Starred Yet
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
            Click the star icon ⭐ next to any file in your subjects to save it here for fast access!
          </p>
          <Link to="/" className="btn btn-primary">
            Explore Study Materials
          </Link>
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
