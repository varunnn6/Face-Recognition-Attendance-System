import { createContext, useContext, useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, getSession } from '../services/authService';
import { initializeData } from '../services/dataService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
    const session = getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = (role, username, password) => {
    const result = authLogin(role, username, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0f' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
