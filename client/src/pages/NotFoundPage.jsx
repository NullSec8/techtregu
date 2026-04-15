import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

export function NotFoundPage() {
  useDocumentTitle(pageTitle('Page not found'));

  return (
    <div className="page-not-found">
      <p className="not-found-code">404</p>
      <h1>This page doesn&apos;t exist</h1>
      <p className="not-found-lead">
        The link may be broken or the listing was removed. Head back to browse live listings.
      </p>
      <div className="empty-actions">
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link to="/login" className="btn">
          Sign in
        </Link>
      </div>
    </div>
  );
}
