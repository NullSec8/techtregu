import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  CONDITION_LABEL,
  categoryEmoji,
  displayCategory,
  normalizeListing,
  specsEntries,
} from '../utils/listingUtils';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/listings/${id}`);
        if (cancelled) return;
        setProduct(normalizeListing(data));
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.status === 404 ? 'Listing not found.' : (e.message || 'Failed to load.'));
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleContactSeller() {
    if (!product?.seller?.email) return;
    window.location.href = `mailto:${product.seller.email}?subject=${encodeURIComponent(
      `TechTregu: ${product.title}`
    )}`;
  }

  if (loading) {
    return <p className="loading-text">Loading listing…</p>;
  }

  if (error || !product) {
    return (
      <div className="page-detail">
        <Link to="/" className="btn btn-back">
          ← Back to listings
        </Link>
        <p className="loading-text">{error || 'Product not found.'}</p>
      </div>
    );
  }

  const seller = product.seller;
  const sellerName = seller?.name || seller?.username || 'Seller';
  const sellerInitials = sellerName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const cond = CONDITION_LABEL[product.condition] || product.condition;
  const specRows = specsEntries(product.specs);

  return (
    <div className="page-detail">
      <Link to="/" className="btn btn-back">
        ← Back to listings
      </Link>

      <div className="detail-grid">
        <div className="detail-img">
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.title} />
          ) : (
            <div className="img-placeholder">{categoryEmoji(product.category)}</div>
          )}
        </div>

        <div className="detail-info">
          <span className="card-category">
            {displayCategory(product.category)} • {cond}
          </span>
          <h1>{product.title}</h1>
          <div className="detail-meta">
            {product.location && <span className="meta-pill">{product.location}</span>}
            <span className="meta-pill">{product.views ?? 0} views</span>
          </div>
          <div className="detail-price">€{Number(product.price).toLocaleString()}</div>
          <p className="detail-desc">{product.description}</p>

          <div className="seller-box">
            <div className="seller-row">
              <div className="seller-avatar">{sellerInitials}</div>
              <div>
                <div className="seller-name">@{seller?.username || 'seller'}</div>
                <div className="seller-label">{sellerName}</div>
              </div>
            </div>
            <button type="button" className="btn btn-contact" onClick={handleContactSeller}>
              Email seller
            </button>
          </div>
        </div>
      </div>

      {specRows.length > 0 && (
        <div className="specs-box">
          <h3>Specifications</h3>
          {specRows.map(([key, val]) => (
            <div className="spec-row" key={key}>
              <span className="spec-key">{key}</span>
              <span className="spec-val">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
