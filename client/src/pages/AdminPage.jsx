import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { normalizeListing } from '../utils/listingUtils';

export function AdminPage() {
  useDocumentTitle(pageTitle('Admin dashboard'));
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [statsRes, listingsRes, reportsRes] = await Promise.all([
        api.get('/listings/admin/stats'),
        api.get('/listings/admin/all?limit=100'),
        api.get('/reports/admin/open'),
      ]);
      setStats(statsRes.data);
      setListings((listingsRes.data.listings || []).map(normalizeListing));
      setReports(reportsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Could not load admin panel');
      setListings([]);
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
      setError(e.response?.data?.message || e.message || 'Failed to update listing status');
    }
  }

  async function deleteListing(item) {
    const ok = window.confirm(`Delete "${item.title}"?`);
    if (!ok) return;
    try {
      await api.delete(`/listings/${item.id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete listing');
    }
  }

  async function resolveReport(reportId) {
    try {
      await api.put(`/reports/${reportId}/resolve`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to resolve report');
    }
  }

  if (!user?.isAdmin) {
    return (
      <div className="page-static">
        <h1>Admin access required</h1>
        <p className="static-lead">This area is only available to admin accounts.</p>
        <p className="static-footer-note">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-admin">
      <h1>Admin dashboard</h1>
      <p className="products-sub">Moderate listings, hide spam, and monitor marketplace health.</p>
      {error ? <div className="banner-error">{error}</div> : null}

      {stats && (
        <div className="admin-stats">
          <div className="value-card">
            <h3>{stats.totalListings}</h3>
            <p>Total listings</p>
          </div>
          <div className="value-card">
            <h3>{stats.activeListings}</h3>
            <p>Active listings</p>
          </div>
          <div className="value-card">
            <h3>{stats.hiddenListings}</h3>
            <p>Hidden listings</p>
          </div>
          <div className="value-card">
            <h3>{stats.totalUsers}</h3>
            <p>Total users</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading admin data…</p>
      ) : (
        <>
          <div className="admin-table-wrap admin-reports-wrap">
            <h3>Reported queue</h3>
            {reports.length === 0 ? (
              <p className="products-sub">No open reports.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Listing</th>
                    <th>Reporter</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <Link to={`/products/${r.listing_id}`} className="admin-link">
                          {r.listing_title || `Listing #${r.listing_id}`}
                        </Link>
                      </td>
                      <td>@{r.reporter_username || 'user'}</td>
                      <td className="admin-reason">{r.reason}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => resolveReport(r.id)}>
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <Link to={`/products/${item.id}`} className="admin-link">
                        {item.title}
                      </Link>
                    </td>
                    <td>@{item.seller?.username || 'seller'}</td>
                    <td>€{Number(item.price).toLocaleString()}</td>
                    <td>{item.isActive ? 'Active' : 'Hidden'}</td>
                    <td>{item.views || 0}</td>
                    <td className="admin-actions">
                      <button type="button" className="btn" onClick={() => toggleActive(item)}>
                        {item.isActive ? 'Hide' : 'Unhide'}
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => deleteListing(item)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
