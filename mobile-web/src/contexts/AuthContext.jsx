import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, unwrapApiData } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('dms-mobile-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('dms-mobile-token');

  useEffect(() => {
    if (token) {
      authApi.getMe()
        .then(res => {
          const userData = unwrapApiData(res.data);
          setUser(userData);
          localStorage.setItem('dms-mobile-user', JSON.stringify(userData));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('dms-mobile-token');
          localStorage.removeItem('dms-mobile-user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login({ username, password });
    const { token: newToken, user: userData } = unwrapApiData(res.data) || {};
    localStorage.setItem('dms-mobile-token', newToken);
    localStorage.setItem('dms-mobile-user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dms-mobile-token');
    localStorage.removeItem('dms-mobile-user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
