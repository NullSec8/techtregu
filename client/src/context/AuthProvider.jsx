import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    const { data } = await api.get('/auth/me');
    setUser(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadMe();
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      await loadMe();
    },
    [loadMe]
  );

  const register = useCallback(
    async (body) => {
      const { data } = await api.post('/auth/register', body);
      localStorage.setItem('token', data.token);
      await loadMe();
    },
    [loadMe]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser: loadMe }),
    [user, loading, login, register, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
