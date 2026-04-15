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
