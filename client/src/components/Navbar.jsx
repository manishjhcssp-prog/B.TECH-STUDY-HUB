import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  Search, 
  Star, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Lock,
  ShieldCheck,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, adminUser, logout, setShowLoginModal, setShowSettingsModal } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('study_hub_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_hub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-wrapper">
        <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-badge">
            <GraduationCap size={22} />
          </div>
          <div className="brand-text">
            B.TECH <span>STUDY HUB</span>
          </div>
        </Link>

        {/* Global Search Bar in Header */}
        <form onSubmit={handleSearchSubmit} className="nav-search-bar">
          <Search size={18} className="nav-search-icon" />
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search study materials, subjects, syllabus, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Desktop Links */}
        <div className="nav-links hide-mobile">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/year/1" className={`nav-link ${location.pathname.startsWith('/year/1') ? 'active' : ''}`}>
            1st Year
          </Link>
          <Link to="/year/2" className={`nav-link ${location.pathname.startsWith('/year/2') ? 'active' : ''}`}>
            2nd Year
          </Link>
          <Link to="/year/3" className={`nav-link ${location.pathname.startsWith('/year/3') ? 'active' : ''}`}>
            3rd Year
          </Link>
          <Link to="/year/4" className={`nav-link ${location.pathname.startsWith('/year/4') ? 'active' : ''}`}>
            4th Year
          </Link>
          <Link to="/favorites" className={`nav-link ${location.pathname === '/favorites' ? 'active' : ''}`}>
            <Star size={16} fill={location.pathname === '/favorites' ? 'currentColor' : 'none'} />
            Favorites
          </Link>
          <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
            <Search size={16} />
            Search
          </Link>

          {/* Admin Login / Status */}
          {isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.12)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                <ShieldCheck size={16} />
                <span>Admin ({adminUser?.username || 'admin'})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="action-icon-btn"
                style={{ width: '28px', height: '28px' }}
                title="Admin Security Settings"
              >
                <Settings size={14} />
              </button>
              <button
                type="button"
                onClick={logout}
                className="action-icon-btn"
                style={{ width: '28px', height: '28px', color: 'var(--accent-rose)' }}
                title="Log Out of Admin"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Lock size={14} />
              <span>Admin Login</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Toggle Light/Dark Theme"
            aria-label="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="show-mobile-only">
          <button 
            type="button" 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', marginBottom: '8px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)'
              }}
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="nav-link">Home</Link>
          <Link to="/year/1" onClick={() => setMobileMenuOpen(false)} className="nav-link">1st Year (Sem 1 & 2)</Link>
          <Link to="/year/2" onClick={() => setMobileMenuOpen(false)} className="nav-link">2nd Year (Sem 3 & 4)</Link>
          <Link to="/year/3" onClick={() => setMobileMenuOpen(false)} className="nav-link">3rd Year (Sem 5 & 6)</Link>
          <Link to="/year/4" onClick={() => setMobileMenuOpen(false)} className="nav-link">4th Year (Sem 7 & 8)</Link>
          <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="nav-link">⭐ Favorites</Link>
          <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="nav-link">🔍 Advanced Search</Link>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Logged in as {adminUser?.username}
                </span>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="btn btn-danger btn-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                <Lock size={15} />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
