import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { useI18n } from '../context/I18nProvider';

function validateField(name, value) {
  const v = (value || '').trim();
  switch (name) {
    case 'username':
      if (!v) return 'fieldRequired';
      if (v.length < 3) return 'usernameTooShort';
      if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'usernameInvalidChars';
      return '';
    case 'email': {
      if (!v) return 'fieldRequired';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'invalidEmail';
      return '';
    }
    case 'password':
      if (!value) return 'fieldRequired';
      if (value.length < 8) return 'passwordTooShort';
      return '';
    case 'firstName':
      if (!v) return 'fieldRequired';
      return '';
    case 'lastName':
      if (!v) return 'fieldRequired';
      return '';
    case 'age': {
      if (!v) return '';
      const n = Number(v);
      if (!Number.isInteger(n) || n < 13 || n > 120) return 'invalidAge';
      return '';
    }
    default:
      return '';
  }
}

function FieldFeedback({ field, value, touched }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const errorKey = validateField(field, value);
  const hasFeedback = field === 'email' || field === 'password';

  if (!touched) return null;
  if (errorKey) return <span className="field-error">{t(errorKey)}</span>;
  if (!hasFeedback) return null;

  const validLabel = field === 'password' ? 'passwordValid' : 'emailValid';
  if (!hovered) return null;
  return <span className="field-success">{t(validLabel)}</span>;
}

function FormField({ label, error, children, className = '' }) {
  return (
    <label className={`form-field ${error ? 'has-error' : ''} ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('createAccount')));
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    age: '',
  });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function getFieldError(field) {
    if (!touched[field]) return '';
    return validateField(field, form[field]);
  }

  function isFormValid() {
    const fields = ['username', 'email', 'password', 'firstName', 'lastName'];
    return fields.every((f) => !validateField(f, form[f]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    // Mark all fields touched on submit
    setTouched({
      username: true, email: true, password: true,
      firstName: true, lastName: true, age: true,
    });
    if (!isFormValid()) {
      setError(t('pleaseFixErrors') || 'Please fix the errors below.');
      return;
    }
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
        age: form.age ? Number(form.age) : undefined,
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
        <h1>{t('createAccount')}</h1>
        <p className="auth-lead">{t('newListingLead')}</p>
        <form onSubmit={onSubmit} className="auth-form" noValidate>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="form-row">
            <div className={`form-field ${getFieldError('firstName') ? 'has-error' : ''}`}>
              <label>
                <span>{t('firstName')}</span>
                <input
                  value={form.firstName}
                  onChange={setField('firstName')}
                  onBlur={() => handleBlur('firstName')}
                  required
                  aria-invalid={!!getFieldError('firstName')}
                  aria-describedby={getFieldError('firstName') ? 'firstName-error' : undefined}
                />
              </label>
              <span id="firstName-error" className="field-error" aria-live="polite">
                {touched.firstName && t(getFieldError('firstName'))}
              </span>
            </div>
            <div className={`form-field ${getFieldError('lastName') ? 'has-error' : ''}`}>
              <label>
                <span>{t('lastName')}</span>
                <input
                  value={form.lastName}
                  onChange={setField('lastName')}
                  onBlur={() => handleBlur('lastName')}
                  required
                  aria-invalid={!!getFieldError('lastName')}
                  aria-describedby={getFieldError('lastName') ? 'lastName-error' : undefined}
                />
              </label>
              <span id="lastName-error" className="field-error" aria-live="polite">
                {touched.lastName && t(getFieldError('lastName'))}
              </span>
            </div>
          </div>
          <div className={`form-field ${getFieldError('username') ? 'has-error' : ''}`}>
            <label>
              <span>{t('username')}</span>
              <input
                value={form.username}
                onChange={setField('username')}
                onBlur={() => handleBlur('username')}
                required
                minLength={3}
                aria-invalid={!!getFieldError('username')}
                aria-describedby={getFieldError('username') ? 'username-error' : undefined}
              />
            </label>
            <span id="username-error" className="field-error" aria-live="polite">
              {touched.username && t(getFieldError('username'))}
            </span>
          </div>
          <div className={`form-field ${getFieldError('email') ? 'has-error' : ''}`}>
            <label>
              <span>{t('email')}</span>
              <input
                type="email"
                value={form.email}
                onChange={setField('email')}
                onBlur={() => handleBlur('email')}
                required
                aria-invalid={!!getFieldError('email')}
                aria-describedby={getFieldError('email') ? 'email-error' : undefined}
              />
            </label>
            <span id="email-error" className="field-error" aria-live="polite">
              {touched.email && t(getFieldError('email'))}
            </span>
          </div>
          <div className={`form-field ${getFieldError('password') ? 'has-error' : ''}`}>
            <label>
              <span>{t('passwordMin')}</span>
              <input
                type="password"
                value={form.password}
                onChange={setField('password')}
                onBlur={() => handleBlur('password')}
                required
                minLength={8}
                aria-invalid={!!getFieldError('password')}
                aria-describedby={getFieldError('password') ? 'password-error' : undefined}
              />
            </label>
            <span id="password-error" className="field-error" aria-live="polite">
              {touched.password && t(getFieldError('password'))}
            </span>
          </div>
          <div className="form-row">
            <div className={`form-field ${getFieldError('age') ? 'has-error' : ''}`}>
              <label>
                <span>{t('age')} ({t('optional')})</span>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={form.age}
                  onChange={setField('age')}
                  onBlur={() => handleBlur('age')}
                  placeholder="13+"
                  inputMode="numeric"
                  aria-invalid={!!getFieldError('age')}
                  aria-describedby={getFieldError('age') ? 'age-error' : undefined}
                />
              </label>
              <span id="age-error" className="field-error" aria-live="polite">
                {touched.age && t(getFieldError('age'))}
              </span>
            </div>
            <div className="form-field">
              <label>
                <span>{t('location')} ({t('optional')})</span>
                <input
                  value={form.location}
                  onChange={setField('location')}
                  placeholder={t('city')}
                  autoComplete="address-level2"
                />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('creating') : t('registerBtn')}
            </button>
          </div>
        </form>
        <p className="auth-footer">
          {t('alreadyHaveAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
        <p className="auth-legal">
          {t('agreeTerms')} <Link to="/terms">{t('terms')}</Link> {t('and')}{' '}
          <Link to="/privacy">{t('privacyPolicy')}</Link>.
        </p>
      </div>
    </div>
  );
}
