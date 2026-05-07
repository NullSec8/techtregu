import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { HelpPage, PrivacyPage, TermsPage, ContactPage } from '../pages/StaticPages';

const HomePage = lazy(() => import('../pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const NewListingPage = lazy(() => import('../pages/NewListingPage').then(m => ({ default: m.NewListingPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const StaticPages = lazy(() => import('../pages/StaticPages').then(m => ({ default: m })));
const AdminPage = lazy(() => import('../pages/AdminPage').then(m => ({ default: m.AdminPage })));
const MyListingsPage = lazy(() => import('../pages/MyListingsPage').then(m => ({ default: m.MyListingsPage })));
const MessagesPage = lazy(() => import('../pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));

function SuspenseFallback() {
  return (
    <div className="loading-text">
      <div className="inline-spinner" role="status" aria-label="Loading"></div>
    </div>
  );
}

export function AnimatedRoutes() {
  const location = useLocation();

  const routeElements = useMemo(() => (
    <div className="page-enter" key={location.pathname}>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/new-listing" element={<ProtectedRoute><NewListingPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  ), [location.pathname]);

  return routeElements;
}