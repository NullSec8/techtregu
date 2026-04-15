function CardSkeleton() {
  return (
    <div className="product-card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-shimmer skeleton-media" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-25" />
        <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-90" />
        <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-70" />
        <div className="skeleton skeleton-shimmer skeleton-line skeleton-w-40" />
      </div>
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div
      className="products-grid products-grid-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading listings"
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
