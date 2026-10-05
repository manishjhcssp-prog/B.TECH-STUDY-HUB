import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import HomePage from './pages/HomePage';
import YearPage from './pages/YearPage';
import SemesterPage from './pages/SemesterPage';
import CategoryPage from './pages/CategoryPage';
import SubjectPage from './pages/SubjectPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* Year routes */}
              <Route path="/year/:yearId" element={<YearPage />} />
              
              {/* Semester routes */}
              <Route path="/year/:yearId/semester/:semId" element={<SemesterPage />} />
              
              {/* Category routes (e.g. /year/1/semester/1/mid-1) */}
              <Route path="/year/:yearId/semester/:semId/:categorySlug" element={<CategoryPage />} />
              
              {/* Subject routes (e.g. /year/1/semester/1/mid-1/mathematics-i) */}
              <Route path="/year/:yearId/semester/:semId/:categorySlug/:subjectSlug" element={<SubjectPage />} />
              
              {/* Global Search */}
              <Route path="/search" element={<SearchPage />} />
              
              {/* Favorites */}
              <Route path="/favorites" element={<FavoritesPage />} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Modals */}
          <LoginModal />
          <AdminSettingsModal />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
