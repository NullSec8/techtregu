import { Link } from 'react-router-dom';
import { categoryEmoji, displayCategory } from '../utils/listingUtils';

export function ProductCard({ product, isFavorite = false, onToggleFavorite }) {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const id = product.id || product._id;
  const sellerId = product.seller?.id ?? product.seller?._id;
  const sellerHandle = product.seller?.username || product.seller?.name || 'seller';
  const signalBadge = Number(product.views || 0) > 20 ? 'Fast Deal' : 'Verified by TechTregu';

  return (
    <article className="product-card">
      <Link to={`/products/${id}`} className="product-card-main">
        <div className="card-media">
          <span className="card-badge">Listed</span>
          {typeof onToggleFavorite === 'function' && (
            <button
              type="button"
              className={`fav-btn${isFavorite ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(id);
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="card-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
            <div className="card-img-placeholder">{categoryEmoji(product.category)}</div>
          )}
        </div>

        <div className="card-body">
          <span className="card-signal-badge">{signalBadge}</span>
          <span className="card-category">{displayCategory(product.category)}</span>
          <h3 className="card-title">{product.title}</h3>
          <p className="card-desc">{product.description.substring(0, 120)}…</p>
          <div className="card-meta-row">
            <span>{product.location || 'Kosovo'}</span>
            <span>{product.views ?? 0} views</span>
          </div>
        </div>
      </Link>

      <div className="card-footer">
        <span className="card-price">
          <span>€</span>
          {Number(product.price).toLocaleString()}
        </span>
        {sellerId != null ? (
          <Link
            to={`/profile/${sellerId}`}
            className="card-seller card-seller-link"
            onClick={(e) => e.stopPropagation()}
          >
            @{sellerHandle}
          </Link>
        ) : (
          <span className="card-seller">@{sellerHandle}</span>
        )}
      </div>
    </article>
  );
}
