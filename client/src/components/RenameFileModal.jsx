import React, { useState } from 'react';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RenameFileModal({ file, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [name, setName] = useState(file.original_name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('File name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await authFetch(`/api/files/${file.id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: name.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename file');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error renaming file');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ background: 'var(--grad-amber)' }}>
              <Edit3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Rename File</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {file.file_type.toUpperCase()} file
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="action-icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--accent-rose)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">File Name</label>
              <input
                type="text"
                className="form-input"
                required
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save New Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
