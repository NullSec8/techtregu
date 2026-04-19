import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';
import { profilePath } from '../utils/profilePath';
import { languages } from '../i18n/translations';

export function Nav({ theme = 'default', onToggleTheme, lang = 'en', onChangeLang }) {
  const { user, loading, logout } = useAuth();
  const unreadMessages = useUnreadMessageCount(user?.id);

  return (
    <nav className="site-nav" aria-label="Main">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">
          Tech<span className="logo-accent">Tregu</span>
        </Link>
        <span className="nav-tagline">Peer-to-peer marketplace</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" end>
          Browse
        </NavLink>
        <NavLink to="/new-listing">Sell</NavLink>
        {user ? <NavLink to="/my-listings">My listings</NavLink> : null}
        {user ? (
          <NavLink to="/messages">
            Messages
            {unreadMessages > 0 ? (
              <span className="nav-badge" aria-label={`${unreadMessages} unread messages`}>
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            ) : null}
          </NavLink>
        ) : null}
        {user?.isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
      </div>
      <div className="nav-actions">
        <select
          className="lang-select"
          value={lang}
          onChange={onChangeLang}
          aria-label="Select language"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-theme" onClick={onToggleTheme}>
          {theme === 'neon' ? 'Classic' : 'Neon'}
        </button>
        {loading ? (
          <span className="nav-muted">…</span>
        ) : user ? (
          <>
            <span className="nav-user">
              Hi, <strong>{user.firstName}</strong>
            </span>
            <div className="btn-group">
              <Link to={profilePath(user)} className="btn btn-sm">
                Profile
              </Link>
              <Link to="/settings" className="btn btn-sm">
                Settings
              </Link>
              <button type="button" className="btn btn-sm" onClick={logout}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
