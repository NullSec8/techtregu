import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { Nav } from './components/Nav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NewListingPage } from './pages/NewListingPage';

import './index.css';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Nav />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/new-listing"
              element={
                <ProtectedRoute>
                  <NewListingPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                Tech<span>Tregu</span>
              </div>
              <p>
                Live marketplace: React → Vite proxy → Express API → MongoDB. Auth via JWT; listings CRUD on
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
                  <Link to="/new-listing">Seller resources</Link>
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
                  <Link to="/login">Sign in</Link>
                </li>
                <li>
                  <a href="mailto:support@techtregu.com">Contact</a>
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
