import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORY_LABEL } from '../utils/listingUtils';
import {
  buildSpecsPayload,
  getSpecFieldDefs,
  initSpecStateForCategory,
} from '../utils/specTemplates';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { pageTitle } from '../siteMeta';

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

export function NewListingPage() {
  const navigate = useNavigate();
  useDocumentTitle(pageTitle('New listing'));
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'gpu',
    condition: 'used',
    location: '',
  });
  const [specs, setSpecs] = useState(() => initSpecStateForCategory('gpu'));
  const [imageUrls, setImageUrls] = useState(['']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setSpecs((prev) => initSpecStateForCategory(form.category, prev));
  }, [form.category]);

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function setSpecField(key) {
    return (e) => setSpecs((s) => ({ ...s, [key]: e.target.value }));
  }

  async function handleImageFiles(e) {
    const files = e.target.files ? [...e.target.files] : [];
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      files.slice(0, 8).forEach((f) => fd.append('images', f));
      const { data } = await api.post('/listings/images', fd);
      const urls = data.urls || [];
      const base = imageUrls.filter((u) => u.trim() !== '');
      setImageUrls([...base, ...urls, '']);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const price = Number.parseFloat(form.price);
      if (Number.isNaN(price) || price < 0) {
        setError('Enter a valid price.');
        setSubmitting(false);
        return;
      }

      const urls = imageUrls.map((u) => u.trim()).filter(Boolean);
      const specPayload = buildSpecsPayload(form.category, specs);

      const { data } = await api.post('/listings', {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        condition: form.condition,
        location: form.location.trim(),
        images: urls,
        specs: specPayload,
      });

      navigate(`/products/${data.id ?? data._id}`);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.map((x) => x.msg).join(', ') ||
        err.message ||
        'Could not create listing';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const specDefs = getSpecFieldDefs(form.category);

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>New listing</h1>
        <p className="auth-lead">Add photos and key specs so buyers can compare listings easily.</p>
        <form onSubmit={onSubmit} className="auth-form">
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <label className="form-field">
            <span>Title</span>
            <input value={form.title} onChange={setField('title')} required minLength={3} />
          </label>
          <label className="form-field">
            <span>Description (min 10 characters)</span>
            <textarea
              value={form.description}
              onChange={setField('description')}
              required
              minLength={10}
              rows={5}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Price (EUR)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={setField('price')}
                required
              />
            </label>
            <label className="form-field">
              <span>Location</span>
              <select value={form.location} onChange={setField('location')} required>
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Category</span>
              <select value={form.category} onChange={setField('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Condition</span>
              <select value={form.condition} onChange={setField('condition')}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </label>
          </div>

          <div className="form-field">
            <span>Photos (optional)</span>
            <p className="products-sub" style={{ margin: '0 0 0.5rem' }}>
              Upload up to 8 images (max 2 MB each). JPEG, PNG, GIF, WebP, or AVIF.
            </p>
            <input type="file" accept="image/*" multiple onChange={handleImageFiles} disabled={uploading} />
            {uploading ? <p className="products-sub">Uploading…</p> : null}
          </div>

          <label className="form-field">
            <span>Image URLs (optional)</span>
            <p className="products-sub" style={{ margin: '0 0 0.5rem' }}>
              Or paste direct links; combined with uploads they become your gallery (first image is the cover).
            </p>
            {imageUrls.map((url, i) => (
              <input
                key={`img-${i}`}
                type="url"
                value={url}
                onChange={(e) =>
                  setImageUrls((rows) => rows.map((r, j) => (j === i ? e.target.value : r)))
                }
                placeholder="https://…"
                style={{ marginBottom: '0.35rem' }}
              />
            ))}
            <button type="button" className="btn" onClick={() => setImageUrls((rows) => [...rows, ''])}>
              Add another URL
            </button>
          </label>

          <div className="specs-edit-block">
            <h3 className="form-section-title">Specifications</h3>
            <p className="products-sub">Fields change by category — fill what applies.</p>
            <div className="form-row form-row-wrap">
              {specDefs.map((def) => (
                <label key={def.key} className="form-field">
                  <span>{def.label}</span>
                  <input
                    value={specs[def.key] ?? ''}
                    onChange={setSpecField(def.key)}
                    placeholder={def.placeholder}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
              {submitting ? 'Publishing…' : 'Publish listing'}
            </button>
            <Link to="/" className="btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
