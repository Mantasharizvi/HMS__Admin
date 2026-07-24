import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hms_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', credentials);

      localStorage.setItem('hms_token', data.token);
      localStorage.setItem('hms_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      return { success: false, message };
    }
  }, []);

const resetPassword = useCallback(async (token, password) => {
    try {
      const { data } = await api.put(`/auth/reset-password/${token}`, { password });
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      return { success: false, message };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update password.';
      return { success: false, message };
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((current) => {
      const next = { ...current, ...updates };
      localStorage.setItem('hms_user', JSON.stringify(next));
      return next;
    });
    // Persist the change server-side too, keyed by the user's Mongo _id.
    if (updates && (user?.id || user?._id)) {
      api.put(`/users/${user.id || user._id}`, updates).catch(() => {
        // Non-fatal: local state already reflects the change; a failed
        // sync here shouldn't block the UI, but surface it in the console.
        console.error('Failed to sync profile update to the server');
      });
    }
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setUser(null);
  }, []);

  const value = {
    user, loading, error, login, logout, updateUser, forgotPassword, resetPassword, changePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
