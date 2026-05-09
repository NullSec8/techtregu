import React, { useEffect, useState } from 'react';
import { HashRouter, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { I18nProvider } from './context/I18nProvider';
import { useI18n } from './context/I18nProvider';
import { useAuth } from './hooks/useAuth';
import { Nav } from './components/Nav';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import { ScrollToTop } from './components/ScrollToTop';
import { SkipLink } from './components/SkipLink';

import './index.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/listings.css';
import './styles/auth.css';
import './styles/profile.css';
import './styles/admin.css';
import './styles/messages.css';
import './styles/footer.css';
import './styles/utilities.css';

function NotificationHandler() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [permission, setPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission;
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    function handleNotification(e) {
      const data = e.detail;
      if (data?.type === 'new_message') {
        new Notification(`${t('newMessageFrom')} ${data.senderName}`, {
          body: data.preview,
          icon: '/favicon.svg',
          tag: 'new-message',
        });
      }
    }
    window.addEventListener('tt-notification', handleNotification);
    return () => window.removeEventListener('tt-notification', handleNotification);
  }, [user, permission, t]);

  if (!user || dismissed || permission !== 'default' || !('Notification' in window)) return null;

  return (
    <div className="push-banner" role="status" aria-live="polite">
      <span>{t('enableNotifications')}</span>
      <button className="btn btn-sm" onClick={async () => {
        const p = await Notification.requestPermission();
        setPermission(p);
        if (p !== 'granted') setDismissed(true);
      }} aria-label={t('enableNotifications')}>{t('enableBtn')}</button>
      <button className="push-dismiss" onClick={() => setDismissed(true)} aria-label={t('dismissBtn')}>×</button>
    </div>
  );
}

function FooterContent() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            Tech<span>Tregu</span>
          </div>
          <p>{t('footerTagline')}</p>
        </div>
        <div className="footer-col">
          <h4>{t('shop')}</h4>
          <ul>
            <li><Link to="/">{t('browse')}</Link></li>
            <li><Link to="/new-listing">{t('sell')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('account')}</h4>
          <ul>
            <li><Link to="/register">{t('register')}</Link></li>
            <li><Link to="/login">{t('signIn')}</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t('support')}</h4>
          <ul>
            <li><Link to="/help">{t('help')}</Link></li>
            <li><a href="mailto:support@techtregu.com">{t('contact')}</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        {t('copyrightLine')}
      </div>
    </footer>
  );
}

export default function App() {
  const [theme] = useState(() => {
    try {
      return localStorage.getItem('tt_theme') || 'default';
    } catch {
      return 'default';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('tt_theme', theme);
    } catch {
      // localStorage not available
    }
  }, [theme]);

  return (
    <HashRouter>
      <I18nProvider>
        <ScrollToTop />
        <SkipLink />
        <AuthProvider>
          <NotificationHandler />
          <Nav />
          <main className="site-main" id="main-content" tabIndex={-1}>
            <AnimatedRoutes />
          </main>
          <FooterContent />
        </AuthProvider>
      </I18nProvider>
    </HashRouter>
  );
}
