import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadMe();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const login = useCallback(
    async ({ email, password }) => {
      await api.post('/auth/login', { email, password });
      await loadMe();
    },
    [loadMe]
  );

  const register = useCallback(
    async (body) => {
      await api.post('/auth/register', body);
      await loadMe();
    },
    [loadMe]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser: loadMe }),
    [user, loading, login, register, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
