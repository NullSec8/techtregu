import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  useDocumentTitle(pageTitle('Create account'));
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.map((x) => x.msg).join(', ') ||
        err.message ||
        'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Create account</h1>
        <p className="auth-lead">POST /api/auth/register — then you can create listings.</p>
        <form onSubmit={onSubmit} className="auth-form">
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="form-row">
            <label className="form-field">
              <span>First name</span>
              <input value={form.firstName} onChange={setField('firstName')} required />
            </label>
            <label className="form-field">
              <span>Last name</span>
              <input value={form.lastName} onChange={setField('lastName')} required />
            </label>
          </div>
          <label className="form-field">
            <span>Username</span>
            <input value={form.username} onChange={setField('username')} required minLength={3} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={setField('email')} required />
          </label>
          <label className="form-field">
            <span>Password (min 6)</span>
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              required
              minLength={8}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Phone (optional)</span>
              <input value={form.phone} onChange={setField('phone')} />
            </label>
            <label className="form-field">
              <span>Location (optional)</span>
              <input value={form.location} onChange={setField('location')} placeholder="City, country" />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Register'}
            </button>
          </div>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-legal">
          By registering you agree to our <Link to="/terms">Terms</Link> and{' '}
          <Link to="/privacy">Privacy policy</Link>.
        </p>
      </div>
    </div>
  );
}
