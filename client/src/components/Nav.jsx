import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Nav() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="site-nav">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">
          Tech<span className="logo-accent">Tregu</span>
        </Link>
        <span className="nav-tagline">Peer-to-peer marketplace</span>
      </div>
      <div className="nav-links">
        <Link to="/">Browse</Link>
        <Link to="/new-listing">Sell</Link>
      </div>
      <div className="nav-actions">
        {loading ? (
          <span className="nav-muted">…</span>
        ) : user ? (
          <>
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
