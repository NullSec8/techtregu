import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function SettingsPage() {
  useDocumentTitle('Settings');
  const { user, refreshUser } = useAuth();
  const [consents, setConsents] = useState({ analytics: false, marketing: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/consents')
      .then((r) => setConsents(r.data))
      .catch(() => setConsents({}))
      .finally(() => setLoading(false));
  }, []);

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

  if (!user) {
    return (
      <div className="page-static">
        <h1>Settings</h1>
        <p>Please <a href="/login">login</a> to manage your settings.</p>
      </div>
    );
  }

  return (
    <div className="page-settings">
      <div className="auth-card">
        <h1>Settings</h1>
        <p className="auth-lead">Manage your privacy and preferences.</p>

        <div className="settings-section">
          <h2>Privacy & Data</h2>
          <p className="products-sub">Control how we use your data.</p>

          <label className="consent-field">
            <input
              type="checkbox"
              checked={consents.analytics}
              onChange={(e) => setConsents((c) => ({ ...c, analytics: e.target.checked }))}
            />
            <div>
              <strong>Analytics</strong>
              <p>Help us improve by sharing anonymous usage data.</p>
            </div>
          </label>

          <label className="consent-field">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={(e) => setConsents((c) => ({ ...c, marketing: e.target.checked }))}
            />
            <div>
              <strong>Marketing</strong>
              <p>Receive updates about new features and promotions.</p>
            </div>
          </label>

          <button type="button" className="btn btn-primary" onClick={saveConsents} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>

        <div className="settings-section">
          <h2>Security</h2>
          <p className="products-sub">Manage your account security.</p>
          <div className="form-actions">
            <a href="/change-password" className="btn">Change Password</a>
          </div>
        </div>

        <div className="settings-section">
          <h2>Your Data</h2>
          <p className="products-sub">Request a copy of your data or delete your account.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => alert('Data export coming soon')}>
              Export My Data
            </button>
            <button type="button" className="btn btn-danger-ghost" onClick={() => alert('Delete account coming soon')}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}