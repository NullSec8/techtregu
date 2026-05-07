import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { displayCategory, normalizeListing } from '../utils/listingUtils';
import { useI18n } from '../context/I18nProvider';

export function MyListingsPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('myListings')));
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/me/listings');
      setItems((data || []).map(normalizeListing));
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(item) {
    try {
      await api.put(`/listings/${item.id}`, { isActive: !item.isActive });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    }
  }

  async function markSold(item) {
    try {
      await api.put(`/listings/${item.id}`, { isActive: false, isSold: true });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    }
  }

  async function remove(item) {
    const ok = window.confirm(`${t('deleteConfirm')}`);
    if (!ok) return;
    try {
      await api.delete(`/listings/${item.id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    }
  }

  return (
    <div className="page-my-listings">
      <div className="products-header">
        <div>
          <h1>{t('myListings')}</h1>
          <p className="products-sub">{t('myListingsLead')}</p>
        </div>
        <Link to="/new-listing" className="btn btn-primary">
          {t('createListing')}
        </Link>
      </div>

      {error ? <div className="banner-error">{error}</div> : null}

      {loading ? (
        <p className="loading-text">{t('loadingListings')}</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>{t('noListings')}</h3>
          <p>{t('startCreating')}</p>
          <p className="empty-actions">
            <Link to="/new-listing" className="btn btn-primary">
              {t('createListing')}
            </Link>
          </p>
        </div>
      ) : (
        <div className="my-listings-grid">
          {items.map((item) => (
            <article className="my-listing-card" key={item.id}>
              <div className="my-listing-top">
                <div>
                  <h3>{item.title}</h3>
                  <p className="products-sub">
                    {displayCategory(item.category)} • €{Number(item.price).toLocaleString()}
                  </p>
                </div>
                <span className={`listing-status ${item.isSold ? 'is-sold' : item.isActive ? 'is-active' : 'is-paused'}`}>
                  {item.isSold ? t('sold') : item.isActive ? t('active') : t('pause')}
                </span>
              </div>
              <p className="my-listing-meta">
                {item.views || 0} {t('viewsLabel')} · {item.location}
              </p>
              <div className="btn-group btn-group-sm">
                <Link to={`/products/${item.id}`} className="btn">
                  {t('view')}
                </Link>
                <Link to={`/products/${item.id}?edit=1`} className="btn">
                  {t('edit')}
                </Link>
                {(!item.isSold) && (
                  <button type="button" className="btn btn-sm" onClick={() => markSold(item)} aria-label={`${t('markSold')}: "${item.title}"`}>
                    ✓ {t('sold')}
                  </button>
                )}
                <button type="button" className="btn btn-sm" onClick={() => toggleActive(item)} aria-label={item.isActive ? `${t('pause')}: "${item.title}"` : `${t('activate')}: "${item.title}"`}>
                  {item.isActive ? '⏸' : '▶'}
                </button>
                <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => remove(item)} aria-label={`${t('deleteListing')}: "${item.title}"`}>
                  🗑
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="products-sub">{t('signedInAs')} @{user?.username || 'seller'}</p>
    </div>
  );
}
