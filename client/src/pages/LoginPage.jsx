import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { useI18n } from '../context/I18nProvider';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('signInTitle')));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(field, value) {
    const v = (value || '').trim();
    if (field === 'email') {
      if (!v) return 'fieldRequired';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'invalidEmail';
      return '';
    }
    if (field === 'password') {
      if (!value) return 'fieldRequired';
      return '';
    }
    return '';
  }

  function getFieldError(field) {
    if (!touched[field]) return '';
    return validate(field, field === 'email' ? email : password);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    if (validate('email', email) || validate('password', password)) {
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      const to = location.state?.from?.pathname || '/';
      navigate(to, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Login failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('signInTitle')}</h1>
        <p className="auth-lead">
          {location.state?.from
            ? t('signInLeadRedirect')
            : t('signInLead')}
        </p>
        <form onSubmit={onSubmit} className="auth-form" noValidate>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className={`form-field ${getFieldError('email') ? 'has-error' : ''}`}>
            <label>
              <span>{t('email')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                required
                autoComplete="email"
                aria-invalid={!!getFieldError('email')}
                aria-describedby={getFieldError('email') ? 'login-email-error' : undefined}
              />
            </label>
            <span id="login-email-error" className="field-error" aria-live="polite">
              {touched.email && t(getFieldError('email'))}
            </span>
          </div>
          <div className={`form-field ${getFieldError('password') ? 'has-error' : ''}`}>
            <label>
              <span>{t('password')}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                required
                autoComplete="current-password"
                aria-invalid={!!getFieldError('password')}
                aria-describedby={getFieldError('password') ? 'login-password-error' : undefined}
              />
            </label>
            <span id="login-password-error" className="field-error" aria-live="polite">
              {touched.password && t(getFieldError('password'))}
            </span>
          </div>
          <p className="form-field-link">
            <Link to="/forgot-password">{t('forgotPassword')}</Link>
          </p>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('signingIn') : t('signInBtn')}
            </button>
          </div>
        </form>
        <p className="auth-footer">
          {t('noAccount')} <Link to="/register">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
}
