'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasPermission as checkPermission } from '@/lib/auth-utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (identifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setUser(data.user);
    setPermissions(data.permissions || []);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setPermissions(data.permissions || []);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const hasPermission = useCallback(
    (code) => checkPermission(user, permissions, code),
    [user, permissions]
  );

  const hasRole = useCallback(
    (...roles) => user && roles.includes(user.role_name),
    [user]
  );

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
