import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { normalizeListing } from '../utils/listingUtils';
import { useI18n } from '../context/I18nProvider';

export function AdminPage() {
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('adminDashboard')));
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PAGE_SIZE = 20;

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
    setDeleteTarget(item);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/listings/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete listing');
      setDeleteTarget(null);
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

  // Filter and paginate listings
  const filtered = listings.filter((item) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'hidden' && item.isActive) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.seller?.username?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  if (!user?.isAdmin) {
    return (
      <div className="page-static">
        <h1>{t('adminAccessRequired')}</h1>
        <p className="static-lead">{t('adminAccessDesc')}</p>
        <p className="static-footer-note">
          <Link to="/">← {t('backHome')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-admin">
      <h1>{t('adminDashboard')}</h1>
      <p className="products-sub">{t('adminLead')}</p>
      {error ? <div className="banner-error">{error}</div> : null}

      {stats && (
        <div className="admin-stats">
          <div className="value-card">
            <h3>{stats.totalListings}</h3>
            <p>{t('totalListings')}</p>
          </div>
          <div className="value-card">
            <h3>{stats.activeListings}</h3>
            <p>{t('activeListingsLabel')}</p>
          </div>
          <div className="value-card">
            <h3>{stats.hiddenListings}</h3>
            <p>{t('hiddenListings')}</p>
          </div>
          <div className="value-card">
            <h3>{stats.totalUsers}</h3>
            <p>{t('totalUsers')}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="loading-text">{t('loadingAdmin')}</p>
      ) : (
        <>
          <div className="admin-table-wrap admin-reports-wrap">
            <h3>{t('reportedQueue')}</h3>
            {reports.length === 0 ? (
              <p className="products-sub">{t('noOpenReports')}</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('reportCol')}</th>
                    <th>{t('listingCol')}</th>
                    <th>{t('reporterCol')}</th>
                    <th>{t('reasonCol')}</th>
                    <th>{t('actionCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>
                        <Link to={`/products/${r.listing_id}`} className="admin-link">
                          {r.listing_title || `${t('listingCol')} #${r.listing_id}`}
                        </Link>
                      </td>
                      <td>@{r.reporter_username || 'user'}</td>
                      <td className="admin-reason">{r.reason}</td>
                      <td>
                        <button type="button" className="btn" onClick={() => resolveReport(r.id)}>
                          {t('resolve')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-table-wrap">
            <div className="admin-table-tools">
              <input
                type="search"
                className="admin-search-input"
                placeholder={t('searchListings') || 'Search listings…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t('searchListings') || 'Search listings'}
              />
              <select
                className="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={t('filterByStatus') || 'Filter by status'}
              >
                <option value="all">{t('all')}</option>
                <option value="active">{t('active')}</option>
                <option value="hidden">{t('hidden')}</option>
              </select>
              <span className="admin-count-badge">
                {filtered.length} / {listings.length}
              </span>
            </div>
            {paginated.length === 0 ? (
              <p className="products-sub">{t('noResults')}</p>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('idCol')}</th>
                      <th>{t('titleCol')}</th>
                      <th>{t('sellerCol')}</th>
                      <th>{t('priceCol')}</th>
                      <th>{t('statusCol')}</th>
                      <th>{t('viewsCol')}</th>
                      <th>{t('actionsCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          <Link to={`/products/${item.id}`} className="admin-link">
                            {item.title}
                          </Link>
                        </td>
                        <td>@{item.seller?.username || 'seller'}</td>
                        <td>€{Number(item.price).toLocaleString()}</td>
                        <td>{item.isActive ? t('active') : t('hidden')}</td>
                        <td>{item.views || 0}</td>
                        <td className="admin-actions">
                          <button type="button" className="btn" onClick={() => toggleActive(item)}>
                            {item.isActive ? t('hide') : t('unhide')}
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => deleteListing(item)}>
                            {t('deleteListingBtn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <nav className="admin-pagination" aria-label={t('pagination') || 'Pagination'}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ← {t('prev') || 'Prev'}
                    </button>
                    <span className="admin-page-info">
                      {t('page') || 'Page'} {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      {t('next') || 'Next'} →
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <div className="delete-confirm-overlay" role="alertdialog" aria-labelledby="admin-delete-heading" aria-modal="true">
          <div className="delete-confirm-dialog">
            <h3 id="admin-delete-heading">{t('confirmDeleteListing') || 'Delete listing?'}</h3>
            <p className="delete-confirm-text">
              {t('deleteListingConfirmText') || 'This will permanently remove'} <strong>"{deleteTarget.title}"</strong>. {t('cannotUndo') || 'This cannot be undone.'}
            </p>
            <div className="delete-confirm-actions">
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                {t('confirmDelete') || 'Confirm delete'}
              </button>
              <button type="button" className="btn" onClick={() => setDeleteTarget(null)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
