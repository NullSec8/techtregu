import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nProvider';

function stars(value) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.round(v);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

export function SellerBox({
  seller,
  product,
  sellerRating,
  canManage,
  isWatchlisted,
  onToggleWatchlist,
  onOpenOffer,
  onOpenRating,
  onContactSeller,
}) {
  const { t } = useI18n();

  const sellerInitials = useMemo(
    () =>
      (seller?.firstName?.[0] || '') + (seller?.lastName?.[0] || '') ||
      (seller?.username?.[0] || 'S'),
    [seller]
  );

  const sellerName = useMemo(
    () =>
      seller?.firstName && seller?.lastName
        ? `${seller.firstName} ${seller.lastName}`
        : seller?.username || t('sellerFallback'),
    [seller, t]
  );

  if (!seller) return null;

  return (
    <div className="seller-box">
      <div className="seller-info">
        <div className="seller-row">
          <div className="seller-avatar">{sellerInitials}</div>
          <div>
            <div className="seller-name">@{seller?.username || 'seller'}</div>
            <div className="seller-label">{sellerName}</div>
          </div>
        </div>
        <p className="seller-rating">
          {sellerRating?.averageRating != null
            ? `${stars(sellerRating.averageRating)} ${sellerRating.averageRating.toFixed(1)} (${sellerRating.totalReviews || 0} ${t('reviews')})`
            : t('noReviews')}
        </p>
      </div>

      {!canManage && seller?.id ? (
        <div className="listing-actions">
          <Link to={`/messages?user=${seller.id}&listing=${product.id}`} className="btn btn-primary btn-lg">
            {t('buyNow')} · €{Number(product.price).toLocaleString()}
          </Link>
          <div className="listing-actions-row">
            <button type="button" className="btn btn-secondary" onClick={onToggleWatchlist}>
              {isWatchlisted ? `★ ${t('saved')}` : `☆ ${t('saveItem')}`}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onOpenOffer}>
              {t('makeOffer')}
            </button>
            <Link to={`/profile/${encodeURIComponent(seller.username || seller.id)}`} className="btn btn-secondary">
              {t('profileBtn')}
            </Link>
          </div>
        </div>
      ) : !canManage ? (
        <div className="listing-actions">
          <Link to="/login" className="btn btn-primary btn-lg">
            {t('signInToContact')}
          </Link>
        </div>
      ) : null}

      <div className="listing-secondary">
        <button type="button" className="btn btn-ghost" onClick={onContactSeller}>
          📧 {t('emailSeller')}
        </button>
        {seller?.id && !canManage && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenRating}>
            {t('rateSeller')}
          </button>
        )}
      </div>
    </div>
  );
}
