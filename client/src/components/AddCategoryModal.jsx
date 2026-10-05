import React, { useState } from 'react';
import { X, FolderPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddCategoryModal({ semesterId, semesterName, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const quickSuggestions = [
    'Presentation',
    'Records',
    'Assignments',
    'Lab Manuals',
    'Previous Question Papers',
    'Projects',
    'Important Questions',
    'Lecture Notes',
    'Reference Books'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await authFetch(`/api/semesters/${semesterId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating category');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ background: 'var(--grad-primary)' }}>
              <FolderPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Add New Category</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Adding section to <strong>{semesterName}</strong>
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
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-input"
                required
                autoFocus
                placeholder="e.g. Presentation, Records, Assignments..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Quick Suggestions:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {quickSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => setName(sug)}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
