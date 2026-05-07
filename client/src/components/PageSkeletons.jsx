import { ProductSkeletonGrid } from './ProductSkeleton';

export function DetailPageSkeleton() {
  return (
    <div className="page-detail" role="status" aria-live="polite" aria-label="Loading listing">
      <div className="skeleton skeleton-shimmer skeleton-block skeleton-h-10 skeleton-w-28" />
      <div className="detail-grid detail-grid-skeleton">
        <div className="skeleton skeleton-shimmer detail-img-skeleton" />
        <div className="detail-info-skeleton">
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-35" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-title" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-50" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-price" />
          <div className="skeleton skeleton-shimmer skeleton-line" />
          <div className="skeleton skeleton-shimmer skeleton-line" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-60" />
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="page-profile" role="status" aria-live="polite" aria-label="Loading profile">
      <div className="skeleton skeleton-shimmer skeleton-block skeleton-h-10 skeleton-w-28" />
      <header className="profile-header profile-header-skeleton">
        <div className="skeleton skeleton-shimmer profile-avatar-skeleton" />
        <div className="profile-headline-skeleton">
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-40 skeleton-h-12" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-25" />
          <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-50" />
        </div>
      </header>
      <ProductSkeletonGrid count={4} />
    </div>
  );
}

export function MessagesPageSkeleton() {
  return (
    <div className="page-messages" role="status" aria-live="polite" aria-label="Loading messages">
      <h1>Messages</h1>
      <p className="products-sub">Chat with buyers and sellers without leaving the platform.</p>
      <div className="messages-layout">
        <aside className="messages-list">
          <h3>Conversations</h3>
          {[1, 2, 3].map((i) => (
            <div key={i} className="conversation-item-skeleton">
              <div className="skeleton skeleton-shimmer skeleton-avatar-sm" />
              <div className="conversation-item-content">
                <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-30" />
                <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-50" />
              </div>
            </div>
          ))}
        </aside>
        <main className="messages-main">
          <div className="messages-empty-skeleton">
            <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-40" />
            <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-60" />
            <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-50" />
          </div>
        </main>
      </div>
    </div>
  );
}
