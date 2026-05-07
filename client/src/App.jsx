import React, { useEffect, useState } from 'react';
import { HashRouter, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { I18nProvider } from './context/I18nProvider';
import { useAuth } from './hooks/useAuth';
import { Nav } from './components/Nav';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import { ScrollToTop } from './components/ScrollToTop';
import { SkipLink } from './components/SkipLink';

import './index.css';
import './App.css';

function NotificationHandler() {
  const { user } = useAuth();
  const [permission, setPermission] = useState('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    const p = Notification.permission;
    setPermission(p);
  }, []);

  useEffect(() => {
    if (!user || permission !== 'granted') return;
    function handleNotification(e) {
      const data = e.detail;
      if (data?.type === 'new_message') {
        new Notification(`New message from ${data.senderName}`, {
          body: data.preview,
          icon: '/favicon.svg',
          tag: 'new-message',
        });
      }
    }
    window.addEventListener('tt-notification', handleNotification);
    return () => window.removeEventListener('tt-notification', handleNotification);
  }, [user, permission]);

  if (!user || dismissed || permission !== 'default' || !('Notification' in window)) return null;

  return (
    <div className="push-banner" role="status" aria-live="polite">
      <span>Enable notifications for new messages</span>
      <button className="btn btn-sm" onClick={async () => {
        const p = await Notification.requestPermission();
        setPermission(p);
        if (p !== 'granted') setDismissed(true);
      }} aria-label="Enable push notifications">Enable</button>
      <button className="push-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss notification prompt">×</button>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
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
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="footer-logo">
                  Tech<span>Tregu</span>
                </div>
                <p>Tech marketplace for Kosovo. Buy and sell with confidence.</p>
              </div>
              <div className="footer-col">
                <h4>Shop</h4>
                <ul>
                  <li><Link to="/">Browse</Link></li>
                  <li><Link to="/new-listing">Sell</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Account</h4>
                <ul>
                  <li><Link to="/register">Register</Link></li>
                  <li><Link to="/login">Sign in</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <ul>
                  <li><Link to="/help">Help</Link></li>
                  <li><a href="mailto:support@techtregu.com">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              © 2026 TechTregu. All rights reserved.
            </div>
          </footer>
        </AuthProvider>
      </I18nProvider>
    </HashRouter>
  );
}
