import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  ArrowRight, 
  BookOpen, 
  Files, 
  Sparkles, 
  Trash2,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import AddCategoryModal from '../components/AddCategoryModal';

export default function SemesterPage() {
  const { yearId, semId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, openLoginPrompt, authFetch } = useAuth();

  const [semData, setSemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  useEffect(() => {
    fetchSemesterData();
  }, [semId]);

  const fetchSemesterData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/semesters/${semId}`);
      if (!res.ok) throw new Error('Semester not found');
      const data = await res.json();
      setSemData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddCategoryClick = () => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to create new categories.');
      return;
    }
    setShowAddCategoryModal(true);
  };

  const handleDeleteCategory = async (catId, catName, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginPrompt('Admin login required to delete categories.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${catName}" and all its materials?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/categories/${catId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSemesterData();
      } else {
        const d = await res.json();
        alert(d.error || 'Cannot delete this category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading semester sections...
      </div>
    );
  }

  if (!semData) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Semester Not Found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: semData.year_name, path: `/year/${semData.year_id}` },
    { label: semData.name, path: `/year/${semData.year_id}/semester/${semData.id}` }
  ];

  // Distinguish the three main sections (MID-1, MID-2, SEM-x) from additional categories
  const semMainSlug = `sem-${semData.sem_number}`;
  const mainCategories = semData.categories.filter(c => 
    c.slug === 'mid-1' || c.slug === 'mid-2' || c.slug === semMainSlug || c.is_default === 1
  );
  const additionalCategories = semData.categories.filter(c => 
    !mainCategories.some(mc => mc.id === c.id)
  );

  return (
    <div className="semester-page">
      <Breadcrumb items={breadcrumbs} />

      {/* Semester Header */}
      <div className="semester-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="unit-badge" style={{ fontSize: '0.85rem' }}>
                {semData.year_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Four-Year Engineering Portal
              </span>
            </div>
            <h1 className="semester-title">
              {semData.name.toUpperCase()}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Select an examination section or supplementary category to access subject-wise study materials
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCategoryClick}
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <FolderPlus size={18} />
            <span>+ ADD CATEGORY</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. THREE MAIN BUTTONS (MID-1, MID-2, SEM-x)
          ======================================================== */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Main Exam Sections</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {mainCategories.map((cat) => (
            <div
              key={cat.id}
              className="category-card featured"
              style={{
                padding: '36px 28px',
                borderWidth: '2px',
                position: 'relative'
              }}
              onClick={() => navigate(`/year/${semData.year_id}/semester/${semData.id}/${cat.slug}`)}
            >
              <div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-main)',
                  letterSpacing: '0.04em',
                  marginBottom: '10px'
                }}>
                  {cat.name.toUpperCase()}
                </div>

                <div className="category-stats" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} />
                    <span>{cat.subject_count} Subjects</span>
                  </div>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Files size={16} />
                    <span>{cat.file_count} Files</span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '18px'
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Enter {cat.name} Subjects
                </span>
                <div className="btn btn-primary btn-sm" style={{ padding: '8px 14px' }}>
                  <span>Open</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          25. ADDITIONAL CATEGORIES (Presentation, Records, etc.)
          ======================================================== */}
      <div>
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>
              Additional & Lab Categories
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Presentation slides, lab records, assignments, and previous papers
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCategoryClick}
            className="btn btn-secondary btn-sm"
          >
            <FolderPlus size={15} />
            <span>+ Add Category</span>
          </button>
        </div>

        {additionalCategories.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            {additionalCategories.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => navigate(`/year/${semData.year_id}/semester/${semData.id}/${cat.slug}`)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      {cat.name}
                    </div>
                    {!cat.is_default && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(cat.id, cat.name, e)}
                        className="action-icon-btn"
                        style={{ color: 'var(--accent-rose)', width: '30px', height: '30px' }}
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="category-stats" style={{ marginBottom: '16px' }}>
                    <span>{cat.subject_count} Subjects</span>
                    <span>•</span>
                    <span>{cat.file_count} Files</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span>View Materials</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <p style={{ marginBottom: '12px' }}>No additional categories yet.</p>
            <button
              type="button"
              onClick={handleAddCategoryClick}
              className="btn btn-outline btn-sm"
            >
              + Add Presentation, Records, or Lab Section
            </button>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          semesterId={semData.id}
          semesterName={semData.name}
          onClose={() => setShowAddCategoryModal(false)}
          onSuccess={() => fetchSemesterData()}
        />
      )}
    </div>
  );
}
