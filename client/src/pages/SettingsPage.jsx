import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../context/I18nProvider';

export function SettingsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('settings'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [consents, setConsents] = useState({ analytics: false, marketing: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'neon';
  });

  useEffect(() => {
    api.get('/consents')
      .then((r) => setConsents(r.data))
      .catch(() => setConsents({}));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'neon');
      localStorage.setItem('theme', 'neon');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    }
  }, [darkMode]);

  async function saveConsents() {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await api.post('/consents', consents);
      setConsents(data.consents);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    if (exporting) return;
    setExporting(true);
    setStatusMessage('');
    try {
      const { data } = await api.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techtregu-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage(t('exportComplete') || 'Export complete — download started.');
    } catch (err) {
      setStatusMessage(err.response?.data?.message || t('exportFailed') || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput.trim().toLowerCase() !== 'delete') return;
    setDeleting(true);
    setStatusMessage('');
    try {
      await api.delete('/users/me');
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setStatusMessage(err.response?.data?.message || t('deleteFailed') || 'Failed to delete account.');
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <div className="page-static">
        <h1>{t('settings')}</h1>
        <p>{t('signIn')} <a href="/login">{t('login')}</a> {t('to')} {t('settings').toLowerCase()}.</p>
      </div>
    );
  }

  return (
    <div className="page-settings">
      <div className="settings-card">
        <h1>{t('settings')}</h1>
        <p className="settings-lead">{t('settingsLead')}</p>

        <div className="settings-section">
          <h2>{t('appearance')}</h2>
          <label className="theme-toggle">
            <span>{t('darkMode')}</span>
            <button
              type="button"
              className={`toggle-btn${darkMode ? ' active' : ''}`}
              onClick={() => setDarkMode(!darkMode)}
              aria-pressed={darkMode}
            >
              <span className="toggle-knob" />
            </button>
          </label>
        </div>

        <div className="settings-section">
          <h2>{t('privacy')}</h2>

          <label className="consent-field">
            <input
              type="checkbox"
              checked={consents.analytics}
              onChange={(e) => setConsents((c) => ({ ...c, analytics: e.target.checked }))}
            />
            <div>
              <strong>{t('analytics')}</strong>
              <p>{t('analyticsDesc')}</p>
            </div>
          </label>

          <label className="consent-field">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={(e) => setConsents((c) => ({ ...c, marketing: e.target.checked }))}
            />
            <div>
              <strong>{t('marketing')}</strong>
              <p>{t('marketingDesc')}</p>
            </div>
          </label>

          <button type="button" className="btn btn-primary" onClick={saveConsents} disabled={saving}>
            {saving ? t('saving') : saved ? t('savedMsg') : t('save')}
          </button>
        </div>

        <div className="settings-section">
          <h2>{t('security')}</h2>
          <a href="/change-password" className="btn btn-full">{t('changePassword')}</a>
        </div>

        <div className="settings-section">
          <h2>{t('account')}</h2>
          <button
            type="button"
            className="btn btn-full"
            onClick={handleExportData}
            disabled={exporting}
            aria-describedby="settings-status"
          >
            {exporting ? (t('exporting') || 'Exporting…') : t('exportData')}
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn btn-full btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              aria-describedby="settings-status"
            >
              {t('deleteAccount')}
            </button>
          ) : (
            <div className="delete-account-confirm" role="alertdialog" aria-labelledby="delete-heading">
              <h3 id="delete-heading" className="delete-heading">{t('confirmDeleteAccount') || 'Confirm account deletion'}</h3>
              <p className="delete-warning">{t('deleteWarning') || 'This cannot be undone. All your listings will be deactivated and your data will be anonymized.'}</p>
              <label className="form-field">
                <span>{t('typeToDelete') || 'Type DELETE to confirm'}</span>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <div className="delete-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteInput.trim().toLowerCase() !== 'delete'}
                >
                  {deleting ? (t('deletingAccount') || 'Deleting…') : t('confirmDelete') || 'Confirm delete'}
                </button>
                <button type="button" className="btn" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div id="settings-status" role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
        {statusMessage && <p className="form-error" role="status" aria-live="polite" style={{ marginTop: '0.5rem' }}>{statusMessage}</p>}
      </div>
    </div>
  );
}
