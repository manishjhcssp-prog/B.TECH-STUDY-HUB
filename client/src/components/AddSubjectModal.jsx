import React, { useState } from 'react';
import { X, BookPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddSubjectModal({ categoryId, categoryName, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a subject name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await authFetch(`/api/categories/${categoryId}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          description: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error creating subject');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-badge" style={{ background: 'var(--grad-emerald)' }}>
              <BookPlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Add New Subject</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Creating subject in <strong>{categoryName}</strong>
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
              <label className="form-label">Subject Name *</label>
              <input
                type="text"
                className="form-input"
                required
                autoFocus
                placeholder="e.g. Database Management Systems (DBMS)"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Code (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CS401, MRV-25"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Relational databases, SQL queries, normalization, and ACID properties..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
