import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../context/I18nProvider';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { profilePath } from '../utils/profilePath';
import { languages } from '../i18n/translations';

export function Nav() {
  const { user, loading, logout } = useAuth();
  const { t, lang, changeLang } = useI18n();
  const unreadMessages = useUnreadMessageCount(user?.id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <nav className="site-nav" aria-label={t('mainNavAria')}>
      <div className="nav-brand">
        <Link to="/" className="nav-logo">
          Tech<span className="logo-accent">Tregu</span>
        </Link>
        <span className="nav-tagline">{t('marketplace')}</span>
      </div>

      <button
        type="button"
        className={`mobile-menu-btn${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={t('toggleMenuAria')}
        aria-expanded={mobileOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
        <NavLink to="/" end onClick={() => setMobileOpen(false)}>{t('browse')}</NavLink>
        <NavLink to="/new-listing" onClick={() => setMobileOpen(false)}>{t('sell')}</NavLink>
        {user ? <NavLink to="/my-listings" onClick={() => setMobileOpen(false)}>{t('myListings', lang)}</NavLink> : null}
        {user ? <NavLink to="/favorites" onClick={() => setMobileOpen(false)}>{t('favorites')}</NavLink> : null}
        {user ? (
          <NavLink to="/messages" onClick={() => setMobileOpen(false)}>
            {t('messages')}
            {unreadMessages > 0 ? (
              <span className="nav-badge" aria-label={`${unreadMessages > 99 ? '99+' : unreadMessages} ${t('unreadAria')}`}>{unreadMessages > 99 ? '99+' : unreadMessages}</span>
            ) : null}
          </NavLink>
        ) : null}
        {user ? <NavLink to="/settings" onClick={() => setMobileOpen(false)}>{t('settings')}</NavLink> : null}
        {user?.isAdmin ? <NavLink to="/admin" onClick={() => setMobileOpen(false)}>{t('admin', lang)}</NavLink> : null}
        {!user && (
          <>
            <NavLink to="/login" onClick={() => setMobileOpen(false)}>{t('signIn')}</NavLink>
            <NavLink to="/register" onClick={() => setMobileOpen(false)} className="nav-cta">{t('register')}</NavLink>
          </>
        )}
      </div>

      <div className="nav-actions">
        {/* Language selector */}
        <div className="lang-selector" style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-sm lang-btn"
            onClick={() => setLangOpen(!langOpen)}
            aria-label={t('changeLangAria')}
            aria-expanded={langOpen}
            aria-controls="lang-menu"
          >
            {lang.toUpperCase()}
          </button>
          {langOpen && (
            <div className="lang-dropdown" id="lang-menu" role="menu">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`lang-option${l.code === lang ? ' active' : ''}`}
                  onClick={() => { changeLang(l.code); setLangOpen(false); }}
                  role="menuitem"
                  aria-label={`${t('switchLangAria')} ${l.nativeName} (${l.name})`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <>
            <span className="nav-user">{t('greeting')} <strong>{user.firstName}</strong></span>
            <Link to={profilePath(user)} className="btn btn-sm">{t('profile')}</Link>
            <button type="button" className="btn btn-sm" onClick={logout}>{t('logout')}</button>
          </>
        ) : loading ? (
          <span className="nav-muted">…</span>
        ) : (
          <>
            <Link to="/login" className="btn">{t('signIn')}</Link>
            <Link to="/register" className="btn btn-primary">{t('register')}</Link>
          </>
        )}
      </div>
    </nav>
  );
}
