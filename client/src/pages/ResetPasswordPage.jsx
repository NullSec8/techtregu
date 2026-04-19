import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ResetPasswordPage() {
  useDocumentTitle('Reset Password');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token || !email) {
      setError('Invalid reset link');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/password/reset', { email, token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="page-login">
        <div className="auth-card">
          <h1>Password reset!</h1>
          <p>Your password has been reset successfully.</p>
          <p className="products-sub">Redirecting to login...</p>
          <Link to="/login" className="btn btn-primary">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="page-login">
        <div className="auth-card">
          <h1>Invalid link</h1>
          <p>This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Set new password</h1>

        {error && <div className="banner-error">{error}</div>}

        <label className="form-field">
          <span>New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
          <span className="form-hint">At least 8 characters with uppercase and number</span>
        </label>

        <label className="form-field">
          <span>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}