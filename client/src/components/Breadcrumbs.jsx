import { Link } from 'react-router-dom';

export function Breadcrumbs({ items }) {
  if (!items?.length) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => (
          <li key={item.href || item.label}>
            {i < items.length - 1 ? (
              <>
                <Link to={item.href}>{item.label}</Link>
                <span className="bc-sep" aria-hidden="true">
                  /
                </span>
              </>
            ) : (
              <span className="bc-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
