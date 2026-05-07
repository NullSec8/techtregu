import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DetailPageSkeleton } from '../components/PageSkeletons';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import {
  CONDITION_LABEL,
  categoryEmoji,
  displayCategory,
  normalizeListing,
  specsEntries,
} from '../utils/listingUtils';
import {
  buildSpecsPayload,
  getSpecFieldDefs,
  initSpecStateForCategory,
} from '../utils/specTemplates';
import { useI18n } from '../context/I18nProvider';

export function ProductDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [similarListings, setSimilarListings] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sellerRating, setSellerRating] = useState({ averageRating: null, totalReviews: 0, latestReviews: [] });
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState('5');
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    condition: 'used',
    category: 'other',
    images: [],
    specState: {},
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [editImageEntries, setEditImageEntries] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const viewKey = `tt_viewed_listing_${id}`;
        const seen = localStorage.getItem(viewKey) === '1';
        const { data } = await api.get(`/listings/${id}${seen ? '' : '?track=1'}`);
        if (!seen) localStorage.setItem(viewKey, '1');
        if (cancelled) return;
        const normalized = normalizeListing(data);
        setProduct(normalized);
        setForm({
          title: normalized.title || '',
          description: normalized.description || '',
          price: normalized.price || '',
          location: normalized.location || '',
          condition: normalized.condition || 'used',
          category: normalized.category || 'other',
          images: Array.isArray(normalized.images) ? [...normalized.images] : [],
          specState: initSpecStateForCategory(normalized.category || 'other', normalized.specs || {}),
        });
        setEditImageEntries(
          (Array.isArray(normalized.images) ? normalized.images : []).map((url) => ({
            id: Math.random().toString(36).slice(2),
            url,
            preview: url,
            file: null,
            progress: 100,
            done: true,
            error: null,
          }))
        );

        try {
          const rawRecent = localStorage.getItem('tt_recently_viewed');
          const parsed = rawRecent ? JSON.parse(rawRecent) : [];
          const next = [String(id), ...parsed.filter((x) => String(x) !== String(id))].slice(0, 20);
          localStorage.setItem('tt_recently_viewed', JSON.stringify(next));
        } catch {
          // ignore
        }

        try {
          const rawWatchlist = localStorage.getItem('tt_favorites');
          const parsedWatchlist = rawWatchlist ? JSON.parse(rawWatchlist) : [];
          setIsWatchlisted(parsedWatchlist.includes(normalized.id));
        } catch {
          // ignore
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.status === 404 ? t('listingNotFound') : (e.message || t('error')));
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

  useDocumentTitle(product ? pageTitle(product.title) : pageTitle('Listing'));
  const canManage =
    !!user &&
    !!product?.seller &&
    (Number(user.id) === Number(product.seller.id) || user.isAdmin);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && canManage) {
      setEditOpen(true);
    }
  }, [searchParams, canManage]);

  useEffect(() => {
    if (!editOpen) return;
    setForm((f) => ({
      ...f,
      specState: initSpecStateForCategory(f.category, f.specState),
    }));
  }, [form.category, editOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadSimilar() {
      if (!product?.category) return;
      try {
        const params = new URLSearchParams();
        params.set('category', product.category);
        params.set('limit', '6');
        const { data } = await api.get(`/listings?${params.toString()}`);
        if (cancelled) return;
        const items = (data.listings || [])
          .map(normalizeListing)
          .filter((item) => Number(item.id) !== Number(product.id))
          .slice(0, 4);
        setSimilarListings(items);
      } catch {
        if (!cancelled) setSimilarListings([]);
      }
    }
    loadSimilar();
    return () => {
      cancelled = true;
    };
  }, [product?.category, product?.id]);

  useEffect(() => {
    let cancelled = false;
    async function loadRating() {
      if (!product?.seller?.id) return;
      try {
        const { data } = await api.get(`/ratings/seller/${product.seller.id}`);
        if (!cancelled) setSellerRating(data);
      } catch {
        if (!cancelled) setSellerRating({ averageRating: null, totalReviews: 0, latestReviews: [] });
      }
    }
    loadRating();
    return () => {
      cancelled = true;
    };
  }, [product?.seller?.id]);

  function handleContactSeller() {
    if (!product?.seller?.email) return;
    window.location.href = `mailto:${product.seller.email}?subject=${encodeURIComponent(
      `TechTregu: ${product.title}`
    )}`;
  }

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="page-detail">
        <Link to="/" className="btn btn-back">
          ← {t('backToListings')}
        </Link>
        <div className="empty-state empty-state-inline">
          <div className="empty-icon">⚠️</div>
          <h2 className="empty-title">{error || t('listingNotFound')}</h2>
          <p>{t('itemRemoved')}</p>
          <p className="empty-actions">
            <Link to="/" className="btn btn-primary">
              {t('browseListings')}
            </Link>
          </p>
        </div>
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

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleDeleteListing() {
    if (!canManage || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/listings/${product.id}`);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleEditImageFiles(e) {
    const files = e.target.files ? [...e.target.files] : [];
    e.target.value = '';
    if (!files.length) return;
    setImageUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      files.slice(0, 8).forEach((f) => fd.append('images', f));
      const { data } = await api.post('/listings/images', fd);
      const urls = data.urls || [];
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error'));
    } finally {
      setImageUploading(false);
    }
  }

  async function handleUpdateListing(e) {
    e.preventDefault();
    if (!canManage || updating) return;
    setUpdating(true);
    setError(null);
    try {
      const price = Number.parseFloat(form.price);
      if (Number.isNaN(price) || price < 0) {
        throw new Error(t('invalidPrice'));
      }
      const imgs = editImageEntries
        .filter((e) => e.done && !e.error)
        .map((e) => e.url || e.preview)
        .filter(Boolean);
      const specPayload = buildSpecsPayload(form.category, form.specState || {});
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        location: form.location.trim(),
        condition: form.condition,
        category: form.category,
        images: imgs,
        specs: specPayload,
      };
      const { data } = await api.put(`/listings/${product.id}`, payload);
      const normalized = normalizeListing(data);
      setProduct(normalized);
      setEditOpen(false);
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    } finally {
      setUpdating(false);
    }
  }

  async function handleReportListing(e) {
    e.preventDefault();
    if (!user || reporting) return;
    setReporting(true);
    setError(null);
    try {
      await api.post('/reports', { listingId: Number(product.id), reason: reportReason.trim() });
      setReportOpen(false);
      setReportReason('');
    } catch (e) {
      setError(e.response?.data?.message || e.message || t('error'));
    } finally {
      setReporting(false);
    }
  }
  function toggleWatchlist() {
    try {
      const raw = localStorage.getItem('tt_favorites');
      const parsed = raw ? JSON.parse(raw) : [];
      const next = isWatchlisted
        ? parsed.filter((x) => String(x) !== String(product.id))
        : [...parsed, product.id];
      localStorage.setItem('tt_favorites', JSON.stringify(next));
      setIsWatchlisted(!isWatchlisted);
    } catch {
      // ignore
    }
  }

  async function handleMakeOffer(e) {
    e.preventDefault();
    if (!user || !seller?.id || offerSending) return;
    setOfferSending(true);
    setError(null);
    try {
      const amount = Number.parseFloat(offerAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid offer amount.');
      }
      const content = `Offer for "${product.title}": €${amount.toLocaleString()}.\n${offerNote.trim() || 'No additional note.'}`;
      await api.post('/messages', {
        receiver: Number(seller.id),
        listing: Number(product.id),
        content,
      });
      window.dispatchEvent(new Event('tt-messages-refresh'));
      setOfferOpen(false);
      setOfferAmount('');
      setOfferNote('');
      navigate(`/messages?user=${seller.id}&listing=${product.id}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to send offer.');
    } finally {
      setOfferSending(false);
    }
  }

  async function handleSubmitRating(e) {
    e.preventDefault();
    if (!user || !seller?.id || ratingSaving) return;
    setRatingSaving(true);
    setError(null);
    try {
      const { data } = await api.post('/ratings', {
        sellerId: Number(seller.id),
        listingId: Number(product.id),
        rating: Number(ratingValue),
        comment: ratingComment.trim(),
      });
      setSellerRating(data);
      setRatingOpen(false);
      setRatingComment('');
      setRatingValue('5');
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to save rating.');
    } finally {
      setRatingSaving(false);
    }
  }

  function stars(value) {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    const full = Math.round(v);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
  }

  return (
    <div className="page-detail">
      <Breadcrumbs
        items={[{ label: t('home'), href: '/' }, { label: product.title }]}
      />
      <Link to="/" className="btn btn-back">
        ← {t('backToListings')}
      </Link>

      <div className="detail-grid">
        <div className="detail-img">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="detail-img-main" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setLightboxIndex(0); setLightboxOpen(true); } }}>
                <img src={product.images[0]} alt={product.title} decoding="async" />
              </div>
              {product.images.length > 1 && (
                <div className="detail-img-thumbnails">
                  {product.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="detail-img-thumb" onClick={() => { setLightboxIndex(i + 1); setLightboxOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setLightboxIndex(i + 1); setLightboxOpen(true); } }} aria-label={`View image ${i + 2} of ${product.images.length}`}>
                      <img src={img} alt={`Image ${i + 2}: ${product.title}`} />
                    </div>
                  ))}
                  {product.images.length > 5 && (
                    <div className="detail-img-more" onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setLightboxIndex(0); setLightboxOpen(true); } }} aria-label={`View all ${product.images.length} images`}>
                      +{product.images.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </>
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
          {canManage && (
            <div className="listing-owner-tools">
              <button type="button" className="btn" onClick={() => setEditOpen((v) => !v)}>
                {editOpen ? t('closeEdit') : t('editListingBtn')}
              </button>
              {!confirmDeleteOpen ? (
                <button type="button" className="btn btn-danger" onClick={() => setConfirmDeleteOpen(true)} disabled={deleting}>
                  {deleting ? t('deleting') : t('deleteListingBtn')}
                </button>
              ) : (
                <div className="delete-confirm" role="alertdialog" aria-modal="true" aria-label={t('deleteListingBtn')}>
                  <p>{t('deleteConfirm')}</p>
                  <div className="form-actions">
                    <button type="button" className="btn btn-danger" onClick={handleDeleteListing} disabled={deleting}>
                      {deleting ? t('deleting') : t('yesDelete')}
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  <button type="button" className="btn btn-secondary" onClick={toggleWatchlist}>
                    {isWatchlisted ? `★ ${t('saved')}` : `☆ ${t('saveItem')}`}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setOfferOpen((v) => !v)}>
                    {offerOpen ? t('cancel') : t('makeOffer')}
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
              <button type="button" className="btn btn-ghost" onClick={handleContactSeller}>
                📧 {t('emailSeller')}
              </button>
              {user && !canManage && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRatingOpen((v) => !v)}>
                  {ratingOpen ? t('cancel') : t('rateSeller')}
                </button>
              )}
              {user && !canManage && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReportOpen((v) => !v)}>
                  {reportOpen ? t('cancel') : t('report')}
                </button>
              )}
            </div>

            {ratingOpen && user && (
              <form className="report-form" onSubmit={handleSubmitRating}>
                <div className="form-row">
                  <label className="form-field">
                    <span>{t('rating')}</span>
                    <select value={ratingValue} onChange={(e) => setRatingValue(e.target.value)}>
                      <option value="5">★★★★★ (5)</option>
                      <option value="4">★★★★☆ (4)</option>
                      <option value="3">★★★☆☆ (3)</option>
                      <option value="2">★★☆☆☆ (2)</option>
                      <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                  </label>
                </div>
                <label className="form-field">
                  <span>{t('commentOptional')}</span>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    maxLength={1000}
                    placeholder={t('comment') + '...'}
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={ratingSaving}>
                    {ratingSaving ? t('saving') : t('submitRating')}
                  </button>
                </div>
              </form>
            )}
            {sellerRating.latestReviews?.length > 0 && (
              <div className="rating-review-list">
                {sellerRating.latestReviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="rating-review-item">
                    <p>
                      <strong>{stars(r.rating)}</strong> by @{r.reviewer?.username || 'user'}
                    </p>
                    {r.comment ? <p>{r.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}
            {offerOpen && user && (
              <form className="report-form" onSubmit={handleMakeOffer}>
                <label className="form-field">
                  <span>{t('yourOffer')}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>{t('noteToSeller')}</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    placeholder={t('pickupDetails') || 'Pickup details, timeline, or condition questions...'}
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={offerSending}>
                    {offerSending ? t('sendingOffer') : t('sendOffer')}
                  </button>
                </div>
              </form>
            )}
            {reportOpen && (
              <form className="report-form" onSubmit={handleReportListing}>
                <label className="form-field">
                  <span>{t('reportReason')}</span>
                  <textarea
                    rows={3}
                    minLength={8}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder={t('reportHint') || 'Spam, misleading info, suspicious behavior, etc.'}
                    required
                  />
                </label>
                <div className="form-actions">
                  <button type="submit" className="btn btn-danger" disabled={reporting}>
                    {reporting ? t('submitting') : t('submitReport')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {canManage && editOpen && (
        <section className="card-panel">
          <h3>{t('editListingBtn')}</h3>
          <form onSubmit={handleUpdateListing} className="auth-form">
            <label className="form-field">
              <span>{t('title')}</span>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </label>
            <label className="form-field">
              <span>{t('description')}</span>
              <textarea
                rows={5}
                minLength={10}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>{t('priceEur')}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  required
                />
              </label>
              <label className="form-field">
                <span>{t('location')}</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field">
                <span>{t('category')}</span>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="laptop">{t('laptop')}</option>
                  <option value="desktop">{t('desktop')}</option>
                  <option value="gpu">{t('gpu')}</option>
                  <option value="cpu">{t('cpu')}</option>
                  <option value="ram">{t('ram')}</option>
                  <option value="storage">{t('storage')}</option>
                  <option value="monitor">{t('monitor')}</option>
                  <option value="peripheral">{t('peripheral')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </label>
              <label className="form-field">
                <span>{t('condition')}</span>
                <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}>
                  <option value="new">{t('new')}</option>
                  <option value="used">{t('used')}</option>
                  <option value="refurbished">{t('refurbished')}</option>
                </select>
              </label>
            </div>
            <div className="form-field">
              <span>{t('addPhotos')}</span>
              <p className="products-sub" style={{ margin: '0 0 0.5rem' }}>
                {t('photosHint')}
              </p>
              <ImageUploader
                value={editImageEntries}
                onChange={setEditImageEntries}
                maxFiles={8}
              />
            </div>
            <div className="specs-edit-block">
              <h4 className="form-section-title">{t('specifications')}</h4>
              <div className="form-row form-row-wrap">
                {getSpecFieldDefs(form.category).map((def) => (
                  <label key={def.key} className="form-field">
                    <span>{def.label}</span>
                    <input
                      value={form.specState?.[def.key] ?? ''}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          specState: { ...p.specState, [def.key]: e.target.value },
                        }))
                      }
                      placeholder={def.placeholder}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={updating || imageUploading}>
                {updating ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </form>
        </section>
      )}

      {specRows.length > 0 && (
        <div className="specs-box">
          <h3>{t('specifications')}</h3>
          {specRows.map(([key, val]) => (
            <div className="spec-row" key={key}>
              <span className="spec-key">{key}</span>
              <span className="spec-val">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {similarListings.length > 0 && (
        <section className="similar-section">
          <div className="products-header">
            <div>
              <h2>{t('similarItems')}</h2>
              <p className="products-sub">{t('similarItemsDesc')}</p>
            </div>
          </div>
          <div className="products-grid">
            {similarListings.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {lightboxOpen && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)} role="dialog" aria-modal="true" aria-label={t('imageViewer') || 'Image viewer'}>
          <button type="button" className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label={t('close') || 'Close'}>
            ×
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={product.images[lightboxIndex]} alt={product.title} />
            {product.images.length > 1 && (
              <div className="lightbox-nav">
                <button
                  type="button"
                  className="lightbox-prev"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + product.images.length) % product.images.length)}
                  aria-label={t('prevImage') || 'Previous image'}
                >
                  ‹
                </button>
                <span className="lightbox-counter" aria-live="polite">{lightboxIndex + 1} {t('of')} {product.images.length}</span>
                <button
                  type="button"
                  className="lightbox-next"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % product.images.length)}
                  aria-label={t('nextImage') || 'Next image'}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
