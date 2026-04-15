import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORY_LABEL } from '../utils/listingUtils';

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

export function NewListingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'gpu',
    condition: 'used',
    location: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
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

      const images = form.imageUrl.trim() ? [form.imageUrl.trim()] : [];

      const { data } = await api.post('/listings', {
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        condition: form.condition,
        location: form.location.trim(),
        images,
        specs: {},
      });

      navigate(`/products/${data._id}`);
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

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>New listing</h1>
        <p className="auth-lead">POST /api/listings (authenticated) — stored in MongoDB.</p>
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
                min="0"
                value={form.price}
                onChange={setField('price')}
                required
              />
            </label>
            <label className="form-field">
              <span>Location</span>
              <input value={form.location} onChange={setField('location')} required placeholder="City, country" />
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
          <label className="form-field">
            <span>Image URL (optional)</span>
            <input
              type="url"
              value={form.imageUrl}
              onChange={setField('imageUrl')}
              placeholder="https://…"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
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
