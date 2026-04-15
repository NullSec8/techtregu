import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUnreadMessageCount } from '../hooks/useUnreadMessageCount';

export function Nav({ theme = 'default', onToggleTheme }) {
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
        <button type="button" className="btn btn-theme" onClick={onToggleTheme}>
          {theme === 'neon' ? 'Classic' : 'Neon'}
        </button>
        {loading ? (
          <span className="nav-muted">…</span>
        ) : user ? (
          <>
            <Link to={`/profile/${user.id}`} className="btn btn-nav-profile">
              Profile
            </Link>
            <span className="nav-user">
              Hi, <strong>{user.firstName}</strong>
            </span>
            <button type="button" className="btn" onClick={logout}>
              Sign out
            </button>
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
