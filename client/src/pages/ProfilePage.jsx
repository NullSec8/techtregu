import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProfilePageSkeleton } from '../components/PageSkeletons';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';
import { ProductCard } from '../components/ProductCard';
import { normalizeListing } from '../utils/listingUtils';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function ProfilePage() {
  const { id: profileKey } = useParams();
  const navigate = useNavigate();
  const { user: me, refreshUser } = useAuth();
  const userId = profileKey ? parseInt(profileKey, 10) : NaN;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState({ averageRating: null, totalReviews: 0, latestReviews: [] });

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    avatar: '',
  });

  const isOwn = !loading && me && profile && Number(me.id) === Number(profile.id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const key = profileKey;
      if (!key) {
        setError('Invalid profile.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let userRes, listingsRes;
        if (!Number.isNaN(userId) && String(userId) === String(key)) {
          [userRes, listingsRes] = await Promise.all([
            api.get(`/users/${userId}`),
            api.get(`/users/${userId}/listings`),
          ]);
          if (userRes?.data?.username) {
            navigate(`/profile/${encodeURIComponent(userRes.data.username)}`, { replace: true });
          }
        } else {
          [userRes, listingsRes] = await Promise.all([
            api.get(`/users/by-username/${encodeURIComponent(key || '')}`),
            api.get(`/users/by-username/${encodeURIComponent(key || '')}/listings`),
          ]);
        }
        if (cancelled) return;
        setProfile(userRes.data);
        setListings((listingsRes.data || []).map(normalizeListing));
        setForm({
          firstName: userRes.data.firstName || '',
          lastName: userRes.data.lastName || '',
          phone: userRes.data.phone || '',
          location: userRes.data.location || '',
          avatar: userRes.data.avatar || '',
        });
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.status === 404 ? 'Profile not found.' : (e.message || 'Failed to load profile.'));
          setProfile(null);
          setListings([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, profileKey, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function loadRating() {
      if (!profile?.id) return;
      try {
        const { data } = await api.get(`/ratings/seller/${profile.id}`);
        if (!cancelled) setRating(data);
      } catch {
        if (!cancelled) setRating({ averageRating: null, totalReviews: 0, latestReviews: [] });
      }
    }
    if (profile?.id) loadRating();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const displayName =
    profile &&
    ([profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username);

  useDocumentTitle(profile ? pageTitle(displayName) : pageTitle('Profile'));

  function stars(value) {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    const full = Math.round(v);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      await api.put('/users/profile', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
        avatar: form.avatar.trim() || undefined,
      });
      const { data } = await api.get(`/users/${userId}`);
      setProfile(data);
      setEditOpen(false);
      await refreshUser();
    } catch (err) {
      setSaveError(
        err.response?.data?.message ||
          err.response?.data?.errors?.map((x) => x.msg).join(', ') ||
          err.message ||
          'Could not save'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="page-profile">
        <Link to="/" className="btn btn-back">
          ← Back to listings
        </Link>
        <div className="empty-state empty-state-inline">
          <div className="empty-icon">👤</div>
          <h2 className="empty-title">{error || 'Profile not found'}</h2>
          <p>Check the URL or return to listings.</p>
          <p className="empty-actions">
            <Link to="/" className="btn btn-primary">
              Browse listings
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const initials = (displayName || '')
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <div className="page-profile">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: displayName }]} />
      <Link to="/" className="btn btn-back">
        ← Back to listings
      </Link>

      <header className="profile-header">
        <div className="profile-avatar-wrap">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">{initials}</div>
          )}
        </div>
        <div className="profile-headline">
          <h1>{displayName}</h1>
          <p className="profile-username">@{profile.username}</p>
          {profile.location && <p className="profile-location">{profile.location}</p>}
          <p className="profile-meta">
            Member since {formatDate(profile.createdAt)}
            {profile.isVerified ? <span className="profile-badge">Verified</span> : null}
          </p>
          <p className="profile-rating-placeholder">
            Seller rating:{' '}
            {rating.averageRating == null
              ? 'No ratings yet'
              : `${stars(rating.averageRating)} ${rating.averageRating.toFixed(1)} (${rating.totalReviews})`}
          </p>
          {isOwn && (
            <button type="button" className="btn btn-primary profile-edit-toggle" onClick={() => setEditOpen(!editOpen)}>
              {editOpen ? 'Close editor' : 'Edit profile'}
            </button>
          )}
        </div>
      </header>

      {isOwn && editOpen && (
        <section className="profile-edit card-panel">
          <h2>Profile details</h2>
          <p className="profile-edit-hint">Updates are saved to your account (PUT /api/users/profile).</p>
          <form onSubmit={handleSaveProfile} className="auth-form">
            {saveError ? (
              <div className="form-error" role="alert">
                {saveError}
              </div>
            ) : null}
            <div className="form-row">
              <label className="form-field">
                <span>First name</span>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </label>
              <label className="form-field">
                <span>Last name</span>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label className="form-field">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Optional"
              />
            </label>
            <label className="form-field">
              <span>Location</span>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, country"
              />
            </label>
            <label className="form-field">
              <span>Avatar image URL</span>
              <input
                type="url"
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                placeholder="https://…"
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="profile-listings-section">
        <div className="products-header">
          <div>
            <h2>Listings by this seller</h2>
            <p className="products-sub">{listings.length} active listing{listings.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <p>No active listings yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {listings.map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
          </div>
        )}
      </section>
      {rating.latestReviews?.length > 0 && (
        <section className="card-panel">
          <h2>Recent ratings</h2>
          <div className="rating-review-list">
            {rating.latestReviews.slice(0, 4).map((r) => (
              <div key={r.id} className="rating-review-item">
                <p>
                  <strong>{stars(r.rating)}</strong> by @{r.reviewer?.username || 'user'}
                </p>
                {r.comment ? <p>{r.comment}</p> : <p>No comment.</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
