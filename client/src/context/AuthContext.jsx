import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('study_hub_admin_token') || '');
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Check token on initial load
  useEffect(() => {
    checkAuth();
  }, [token]);

  const checkAuth = async () => {
    if (!token) {
      setIsAdmin(false);
      setAdminUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.isAdmin) {
        setIsAdmin(true);
        setAdminUser(data.admin);
      } else {
        setIsAdmin(false);
        setAdminUser(null);
        localStorage.removeItem('study_hub_admin_token');
        setToken('');
      }
    } catch (err) {
      console.error('Auth verification failed', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }

    localStorage.setItem('study_hub_admin_token', data.token);
    setToken(data.token);
    setIsAdmin(true);
    setAdminUser(data.admin);
    setShowLoginModal(false);
    setLoginMessage('');
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn('Logout request error:', e);
    }

    localStorage.removeItem('study_hub_admin_token');
    setToken('');
    setIsAdmin(false);
    setAdminUser(null);
  };

  const openLoginPrompt = (message = 'Admin login required to perform this action.') => {
    setLoginMessage(message);
    setShowLoginModal(true);
  };

  // Helper for authorized fetch
  const authFetch = (url, options = {}) => {
    const headers = options.headers ? new Headers(options.headers) : new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminUser,
        token,
        loading,
        login,
        logout,
        showLoginModal,
        setShowLoginModal,
        loginMessage,
        setLoginMessage,
        openLoginPrompt,
        authFetch,
        showSettingsModal,
        setShowSettingsModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
