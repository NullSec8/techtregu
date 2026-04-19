import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ChangePasswordPage() {
  useDocumentTitle('Change Password');
  const logout = useAuth((a) => a.logout);
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (newPass.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/\d/.test(newPass)) {
      setError('Password must contain uppercase, lowercase, and number');
      return;
    }
    if (newPass !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/change', {
        currentPassword: current,
        newPassword: newPass,
      });
      setSuccess(true);
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Change Password</h1>
        
        {error && <div className="banner-error">{error}</div>}
        {success && <div className="banner-success">Password changed! Redirecting...</div>}

        <label className="form-field">
          <span>Current Password</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </label>

        <label className="form-field">
          <span>New Password</span>
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={8} />
          <span className="form-hint">At least 8 characters with uppercase, lowercase, and number</span>
        </label>

        <label className="form-field">
          <span>Confirm New Password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}