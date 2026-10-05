import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookPlus, 
  BookOpen, 
  Files, 
  UploadCloud, 
  Trash2, 
  Edit2, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/Breadcrumb';
import AddSubjectModal from '../components/AddSubjectModal';
import UploadModal from '../components/UploadModal';

export default function CategoryPage() {
  const { yearId, semId, categorySlug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, openLoginPrompt, authFetch } = useAuth();

  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [quickUploadSubject, setQuickUploadSubject] = useState(null);

  useEffect(() => {
    fetchCategoryData();
  }, [semId, categorySlug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      // First lookup category by semId and categorySlug
      const semRes = await fetch(`/api/semesters/${semId}`);
      if (!semRes.ok) throw new Error('Semester not found');
      const semJson = await semRes.json();

      const matchedCat = semJson.categories.find(c => c.slug === categorySlug);
      if (!matchedCat) throw new Error('Category not found');

      const catRes = await fetch(`/api/categories/${matchedCat.id}`);
      const catJson = await catRes.json();

      setCategoryData(catJson);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddSubjectClick = () => {
    if (!isAdmin) {
      openLoginPrompt('Admin login required to create new subjects.');
      return;
    }
    setShowAddSubjectModal(true);
  };

  const handleQuickUpload = (sub, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginPrompt('Admin login required to upload study materials.');
      return;
    }
    setQuickUploadSubject(sub);
  };

  const handleDeleteSubject = async (subId, subName, e) => {
    e.stopPropagation();
    if (!isAdmin) {
      openLoginPrompt('Admin login required to delete subjects.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete subject "${subName}" and all its materials?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/subjects/${subId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategoryData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading subjects...
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Section Not Found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: categoryData.year_name, path: `/year/${categoryData.year_id}` },
    { label: categoryData.semester_name, path: `/year/${categoryData.year_id}/semester/${categoryData.semester_id}` },
    { label: categoryData.name, path: `/year/${categoryData.year_id}/semester/${categoryData.semester_id}/${categoryData.slug}` }
  ];

  return (
    <div className="category-page">
      <Breadcrumb items={breadcrumbs} />

      {/* Category Banner */}
      <div className="semester-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="unit-badge">
                {categoryData.year_name}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {categoryData.semester_name}
              </span>
            </div>
            <h1 className="semester-title">
              {categoryData.name.toUpperCase()} SUBJECTS
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Subject-wise study materials, lecture files, question banks, and syllabus
            </p>
          </div>

          {/* 10. ADD SUBJECT BUTTON */}
          <button
            type="button"
            onClick={handleAddSubjectClick}
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <BookPlus size={18} />
            <span>+ ADD SUBJECT</span>
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>
            Subjects in {categoryData.name} ({categoryData.subjects?.length || 0})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Select a subject to upload notes or edit its structured syllabus
          </p>
        </div>
      </div>

      {categoryData.subjects && categoryData.subjects.length > 0 ? (
        <div className="subjects-grid">
          {categoryData.subjects.map((sub) => (
            <div
              key={sub.id}
              className="subject-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/year/${categoryData.year_id}/semester/${categoryData.semester_id}/${categoryData.slug}/${sub.slug}`)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    {sub.code && <span className="subject-code">{sub.code}</span>}
                    <h3 className="subject-name">{sub.name}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSubject(sub.id, sub.name, e)}
                    className="action-icon-btn"
                    style={{ color: 'var(--accent-rose)' }}
                    title="Delete Subject"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {sub.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                    {sub.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Files size={15} />
                    <span>{sub.file_count} Files</span>
                  </div>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
                    <BookOpen size={15} />
                    <span>Syllabus Available</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={(e) => handleQuickUpload(sub, e)}
                  className="btn btn-secondary btn-sm"
                  title="Directly upload file to this subject"
                >
                  <UploadCloud size={14} />
                  <span>+ Add File</span>
                </button>

                <div className="btn btn-primary btn-sm">
                  <span>Enter</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
            No Subjects Yet in {categoryData.name}
          </h3>
          <p style={{ marginBottom: '20px' }}>
            Click below to create your first subject (e.g. Mathematics, Physics, Programming).
          </p>
          <button
            type="button"
            onClick={handleAddSubjectClick}
            className="btn btn-primary"
          >
            <BookPlus size={16} />
            + ADD SUBJECT
          </button>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <AddSubjectModal
          categoryId={categoryData.id}
          categoryName={categoryData.name}
          onClose={() => setShowAddSubjectModal(false)}
          onSuccess={() => fetchCategoryData()}
        />
      )}

      {/* Quick Upload Modal */}
      {quickUploadSubject && (
        <UploadModal
          subjectId={quickUploadSubject.id}
          subjectName={quickUploadSubject.name}
          onClose={() => setQuickUploadSubject(null)}
          onSuccess={() => fetchCategoryData()}
        />
      )}
    </div>
  );
}
