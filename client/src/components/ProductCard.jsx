import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categoryEmoji, displayCategory } from '../utils/listingUtils';
import { useI18n } from '../context/I18nProvider';

const ProductCardInner = memo(function ProductCardInner({ product, isFavorite, onToggleFavorite }) {
  const { t } = useI18n();
  const imageUrl = useMemo(
    () => product.images && product.images.length > 0 ? product.images[0] : null,
    [product.images]
  );

  const id = useMemo(() => product.id || product._id, [product.id, product._id]);
  const sellerId = useMemo(() => product.seller?.id ?? product.seller?._id, [product.seller]);
  const sellerHandle = useMemo(
    () => product.seller?.username || product.seller?.name || 'seller',
    [product.seller]
  );
  const signalBadge = useMemo(
    () => Number(product.views || 0) > 20 ? t('fastDeal') : t('verified'),
    [product.views, t]
  );
  const description = useMemo(
    () => product.description.substring(0, 120) + '…',
    [product.description]
  );
  const price = useMemo(
    () => Number(product.price).toLocaleString(),
    [product.price]
  );

  return (
    <article className="product-card">
      <Link to={`/products/${id}`} className="product-card-main">
        <div className="card-media">
          <span className="card-badge">{t('listed')}</span>
          {typeof onToggleFavorite === 'function' && (
            <button
              type="button"
              className={`fav-btn${isFavorite ? ' is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(id);
              }}
              aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="card-img"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="card-img-placeholder" aria-label={product.title || `${displayCategory(product.category)} listing`}>{categoryEmoji(product.category)}</div>
          )}
        </div>

        <div className="card-body">
          <span className="card-signal-badge">{signalBadge}</span>
          <span className="card-category">{displayCategory(product.category)}</span>
          <h3 className="card-title">{product.title}</h3>
          <p className="card-desc">{description}</p>
          <div className="card-meta-row">
            <span aria-label={`Location: ${product.location || 'Kosovo'}`}>{product.location || 'Kosovo'}</span>
            <span aria-label={`${product.views ?? 0} ${t('viewsLabel')}`}>{product.views ?? 0} {t('viewsLabel')}</span>
          </div>
        </div>
      </Link>

      <div className="card-footer">
        <span className="card-price">
          <span>€</span>
          {price}
        </span>
        {sellerId != null ? (
          <Link
            to={`/profile/${encodeURIComponent(sellerHandle || sellerId)}`}
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
});

export function ProductCard(props) {
  return <ProductCardInner {...props} />;
}

export const ProductCardMemo = memo(ProductCard, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.updatedAt === next.product.updatedAt &&
    prev.isFavorite === next.isFavorite
  );
});