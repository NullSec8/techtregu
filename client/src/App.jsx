import React, { useEffect, useState } from 'react';
import { HashRouter, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { Nav } from './components/Nav';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import { ScrollToTop } from './components/ScrollToTop';
import { SkipLink } from './components/SkipLink';

import './index.css';
import './App.css';

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
      // ignore storage errors
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'default' ? 'neon' : 'default'));
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <SkipLink />
      <AuthProvider>
        <Nav theme={theme} onToggleTheme={toggleTheme} />
        <main className="site-main" id="main-content" tabIndex={-1}>
          <AnimatedRoutes />
        </main>
        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                Tech<span>Tregu</span>
              </div>
              <p>
                Live marketplace: React → Vite proxy → Express API → MySQL. Auth via JWT; listings CRUD on
                /api/listings.
              </p>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li>
                  <Link to="/">Browse all</Link>
                </li>
                <li>
                  <Link to="/new-listing">Sell an item</Link>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li>
                  <Link to="/help">Seller resources</Link>
                </li>
                <li>
                  <Link to="/register">Create account</Link>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li>
                  <Link to="/help">Help center</Link>
                </li>
                <li>
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <a href="mailto:support@techtregu.com">Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer-col footer-col-legal">
              <h4>Legal</h4>
              <ul>
                <li>
                  <Link to="/terms">Terms</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            © 2026 TechTregu. All rights reserved. · Built for Kosovo&apos;s tech community.
          </div>
        </footer>
      </AuthProvider>
    </HashRouter>
  );
}
