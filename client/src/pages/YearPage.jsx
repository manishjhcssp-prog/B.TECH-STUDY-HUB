import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, Files, Layers, ChevronRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

export default function YearPage() {
  const { yearId } = useParams();
  const navigate = useNavigate();
  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYear();
  }, [yearId]);

  const fetchYear = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/years/${yearId}`);
      if (!res.ok) throw new Error('Year not found');
      const data = await res.json();
      setYearData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading year details...
      </div>
    );
  }

  if (!yearData) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Academic Year Not Found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { label: yearData.name, path: `/year/${yearData.id}` }
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs} />

      {/* Year Banner */}
      <div className="semester-hero" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div className="brand-badge" style={{ padding: '10px 14px', fontSize: '1.2rem' }}>
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 className="semester-title">{yearData.name.toUpperCase()}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              B.Tech Academic Curriculum & Study Materials
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📚 <strong>2 Semesters</strong>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📖 <strong>{yearData.semesters.reduce((acc, s) => acc + s.subject_count, 0)} Subjects</strong>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📄 <strong>{yearData.semesters.reduce((acc, s) => acc + s.file_count, 0)} Uploaded Files</strong>
          </div>
        </div>
      </div>

      {/* Semesters Cards Grid */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Select Semester</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {yearData.semesters.map((sem) => (
          <div
            key={sem.id}
            className="category-card featured"
            style={{ padding: '32px 28px', cursor: 'pointer' }}
            onClick={() => navigate(`/year/${yearData.id}/semester/${sem.id}`)}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--primary)'
                }}>
                  {sem.name.toUpperCase()}
                </span>
                <span className="unit-badge">
                  Sem {sem.sem_number}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} />
                  <span>{sem.subject_count} Subjects</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Files size={16} />
                  <span>{sem.file_count} Files</span>
                </div>
              </div>

              {/* Three main sections preview */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <span style={{ background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                  MID-1
                </span>
                <span style={{ background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                  MID-2
                </span>
                <span style={{ background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600 }}>
                  SEM-{sem.sem_number}
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px'
            }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                View MID & SEM Sections
              </span>
              <div className="btn btn-primary btn-sm">
                <span>Open Semester</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
