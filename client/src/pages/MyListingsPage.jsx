import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { displayCategory, normalizeListing } from '../utils/listingUtils';

export function MyListingsPage() {
  useDocumentTitle(pageTitle('My listings'));
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
      setError(e.response?.data?.message || e.message || 'Failed to load your listings');
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
      setError(e.response?.data?.message || e.message || 'Failed to update listing');
    }
  }

  async function markSold(item) {
    try {
      await api.put(`/listings/${item.id}`, { isActive: false, isSold: true });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to mark as sold');
    }
  }

  async function remove(item) {
    const ok = window.confirm(`Delete "${item.title}"?`);
    if (!ok) return;
    try {
      await api.delete(`/listings/${item.id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete listing');
    }
  }

  return (
    <div className="page-my-listings">
      <div className="products-header">
        <div>
          <h1>My listings</h1>
          <p className="products-sub">Manage your inventory: edit, delete, and pause/unpause listings.</p>
        </div>
        <Link to="/new-listing" className="btn btn-primary">
          New listing
        </Link>
      </div>

      {error ? <div className="banner-error">{error}</div> : null}

      {loading ? (
        <p className="loading-text">Loading your listings…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h3>No listings yet</h3>
          <p>Start by creating your first listing.</p>
          <p className="empty-actions">
            <Link to="/new-listing" className="btn btn-primary">
              Create listing
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
                  {item.isSold ? 'Sold' : item.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="my-listing-meta">
                {item.views || 0} views · {item.location}
              </p>
              <div className="btn-group btn-group-sm">
                <Link to={`/products/${item.id}`} className="btn">
                  View
                </Link>
                <Link to={`/products/${item.id}?edit=1`} className="btn">
                  Edit
                </Link>
                {(!item.isSold) && (
                  <button type="button" className="btn btn-sm" onClick={() => markSold(item)}>
                    ✓ Sold
                  </button>
                )}
                <button type="button" className="btn btn-sm" onClick={() => toggleActive(item)}>
                  {item.isActive ? '⏸' : '▶'}
                </button>
                <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => remove(item)}>
                  🗑
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="products-sub">Signed in as @{user?.username || 'seller'}</p>
    </div>
  );
}
