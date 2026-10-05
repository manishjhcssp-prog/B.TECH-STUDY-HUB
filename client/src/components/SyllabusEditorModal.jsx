import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  BookOpen, 
  Save, 
  FileText, 
  Upload, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SyllabusEditorModal({ subjectId, subjectName, initialSyllabus, onClose, onSaveSuccess }) {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'import'
  const [title, setTitle] = useState(initialSyllabus?.title || `${subjectName} Syllabus`);
  const [units, setUnits] = useState(() => {
    if (initialSyllabus && initialSyllabus.units && initialSyllabus.units.length > 0) {
      return initialSyllabus.units.map(u => ({
        unitNumber: u.unit_number || u.unitNumber,
        title: u.title,
        topics: (u.topics || []).map(t => typeof t === 'string' ? t : (t.topic_name || t.name))
      }));
    }
    // Default initial empty unit if none exists
    return [
      { unitNumber: 1, title: 'UNIT 1: ', topics: [''] }
    ];
  });

  const [importText, setImportText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Add new unit
  const handleAddUnit = () => {
    const nextNum = units.length + 1;
    setUnits(prev => [
      ...prev,
      { unitNumber: nextNum, title: `UNIT ${nextNum}: `, topics: [''] }
    ]);
  };

  // Delete unit
  const handleDeleteUnit = (index) => {
    setUnits(prev => prev.filter((_, i) => i !== index).map((u, i) => ({
      ...u,
      unitNumber: i + 1
    })));
  };

  // Change unit title
  const handleUnitTitleChange = (index, value) => {
    setUnits(prev => {
      const copy = [...prev];
      copy[index].title = value;
      return copy;
    });
  };

  // Add topic to unit
  const handleAddTopic = (unitIndex) => {
    setUnits(prev => {
      const copy = [...prev];
      copy[unitIndex].topics = [...copy[unitIndex].topics, ''];
      return copy;
    });
  };

  // Update topic text
  const handleTopicChange = (unitIndex, topicIndex, value) => {
    setUnits(prev => {
      const copy = [...prev];
      copy[unitIndex].topics[topicIndex] = value;
      return copy;
    });
  };

  // Delete topic
  const handleDeleteTopic = (unitIndex, topicIndex) => {
    setUnits(prev => {
      const copy = [...prev];
      copy[unitIndex].topics = copy[unitIndex].topics.filter((_, idx) => idx !== topicIndex);
      return copy;
    });
  };

  // Parse imported text into Units and Topics
  const handleParseImportText = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedUnits = [];
    let currentUnit = null;

    lines.forEach(line => {
      const isUnitHeader = /^unit\s*\d+/i.test(line) || /^module\s*\d+/i.test(line) || /^chapter\s*\d+/i.test(line);

      if (isUnitHeader) {
        if (currentUnit) {
          parsedUnits.push(currentUnit);
        }
        currentUnit = {
          unitNumber: parsedUnits.length + 1,
          title: line,
          topics: []
        };
      } else {
        const cleanTopic = line.replace(/^[\-\*\•\d+\.]\s*/, '').trim();
        if (cleanTopic) {
          if (!currentUnit) {
            currentUnit = {
              unitNumber: 1,
              title: 'UNIT 1: Course Topics',
              topics: []
            };
          }
          currentUnit.topics.push(cleanTopic);
        }
      }
    });

    if (currentUnit) {
      parsedUnits.push(currentUnit);
    }

    if (parsedUnits.length > 0) {
      setUnits(parsedUnits);
      setActiveTab('editor');
    } else {
      setErrorMessage('Could not find units in the pasted text. Format as "UNIT 1: Title" followed by topics.');
    }
  };

  // Save to backend
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const payload = {
        title: title.trim() || `${subjectName} Syllabus`,
        units: units.map((u, i) => ({
          unitNumber: i + 1,
          title: u.title.trim() || `UNIT ${i + 1}`,
          topics: u.topics.filter(t => t && t.trim())
        }))
      };

      const res = await authFetch(`/api/subjects/${subjectId}/syllabus/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save syllabus');
      }

      onSaveSuccess(data);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error saving syllabus');
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-badge" style={{ background: 'var(--grad-cyan)' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Syllabus Editor</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {subjectName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
                onClick={() => setActiveTab('editor')}
              >
                Structure Editor
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
                onClick={() => setActiveTab('import')}
              >
                Import / Paste
              </button>
            </div>

            <button type="button" onClick={onClose} className="action-icon-btn" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'editor' ? (
            <div>
              <div className="form-group">
                <label className="form-label">Syllabus Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mathematics-I Curriculum & Course Structure"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Units & Topics ({units.length} Units)
                </h4>
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Plus size={15} />
                  Add Unit
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {units.map((unit, uIdx) => (
                  <div
                    key={uIdx}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span className="unit-badge">Unit {uIdx + 1}</span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, padding: '8px 12px', fontWeight: 600 }}
                        value={unit.title}
                        onChange={e => handleUnitTitleChange(uIdx, e.target.value)}
                        placeholder="Unit Title (e.g. UNIT 1: Matrices and Linear Systems)"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(uIdx)}
                        className="action-icon-btn"
                        style={{ color: 'var(--accent-rose)' }}
                        title="Delete Unit"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Topics in unit */}
                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Topics:
                      </div>
                      {unit.topics.map((topic, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>•</span>
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1, padding: '6px 10px', fontSize: '0.88rem' }}
                            value={topic}
                            onChange={e => handleTopicChange(uIdx, tIdx, e.target.value)}
                            placeholder="Topic name..."
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(uIdx, tIdx)}
                            className="action-icon-btn"
                            style={{ width: '28px', height: '28px' }}
                            title="Delete Topic"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddTopic(uIdx)}
                        className="btn btn-outline btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.8rem', padding: '4px 10px' }}
                      >
                        <Plus size={13} />
                        Add Topic
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Paste your syllabus text below. The smart parser will recognize lines starting with "UNIT 1", "MODULE 1", etc. and organize topics under each unit.
              </p>
              <textarea
                className="form-textarea"
                rows={12}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`Example:
UNIT 1: Matrices and Linear Systems
- Rank of a Matrix
- System of Linear Equations
- Eigenvalues and Eigenvectors

UNIT 2: Differential Calculus
- Rolle's Theorem
- Taylor's and Maclaurin's Theorems`}
              />
              <button
                type="button"
                onClick={handleParseImportText}
                className="btn btn-primary"
                style={{ marginTop: '12px' }}
              >
                <FileText size={16} />
                Parse & Load Into Editor
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Syllabus'}
          </button>
        </div>
      </div>
    </div>
  );
}
