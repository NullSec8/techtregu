import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ForgotPasswordPage() {
  useDocumentTitle('Forgot Password');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/password/forgot', { email });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="page-login">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p>If an account with that email exists, we've sent password reset instructions.</p>
          <p className="products-sub">Check your inbox (and spam folder) for the reset link.</p>
          <Link to="/login" className="btn btn-primary">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-login">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Forgot password?</h1>
        <p>Enter your email and we'll send reset instructions.</p>

        {error && <div className="banner-error">{error}</div>}

        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}