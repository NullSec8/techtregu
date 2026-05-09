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
import { useI18n } from '../context/I18nProvider';
import { ImageUploader } from '../components/ImageUploader';

const CATEGORIES = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

function validateListingField(name, value) {
  const v = (value || '').trim();
  switch (name) {
    case 'title':
      if (!v) return 'fieldRequired';
      if (v.length < 3) return 'titleTooShort';
      return '';
    case 'description':
      if (!v) return 'fieldRequired';
      if (v.length < 10) return 'descTooShort';
      return '';
    case 'price': {
      if (!v) return 'fieldRequired';
      const n = Number.parseFloat(v);
      if (Number.isNaN(n) || n <= 0) return 'invalidPrice';
      return '';
    }
    case 'location':
      if (!v) return 'fieldRequired';
      return '';
    default:
      return '';
  }
}

export function NewListingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  useDocumentTitle(pageTitle(t('newListing')));
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'gpu',
    condition: 'used',
    location: '',
  });
  const [specs, setSpecs] = useState(() => initSpecStateForCategory('gpu'));
  const [imageEntries, setImageEntries] = useState([]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setSpecs((prev) => initSpecStateForCategory(form.category, prev)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [form.category]);

  function setField(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function setSpecField(key) {
    return (e) => setSpecs((s) => ({ ...s, [key]: e.target.value }));
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function getFieldError(field) {
    if (!touched[field]) return '';
    return validateListingField(field, form[field]);
  }

  function isFormValid() {
    const fields = ['title', 'description', 'price', 'location'];
    return fields.every((f) => !validateListingField(f, form[f]));
  }

  function getUploadedImageUrls() {
    return imageEntries
      .filter((e) => typeof e === 'string' || (e.done && !e.error))
      .map((e) => (typeof e === 'string' ? e : e.url))
      .filter(Boolean)
      .concat(imageUrls.filter((u) => u.trim()));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setTouched({ title: true, description: true, price: true, location: true });
    if (!isFormValid()) {
      setError(t('pleaseFixErrors'));
      return;
    }
    setSubmitting(true);
    try {
      const price = Number.parseFloat(form.price);
      const urls = getUploadedImageUrls();
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
        <h1>{t('newListing')}</h1>
        <p className="auth-lead">{t('newListingLead')}</p>
        <form onSubmit={onSubmit} className="auth-form" noValidate>
          {error ? (
            <div className="form-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className={`form-field ${getFieldError('title') ? 'has-error' : ''}`}>
            <label>
              <span>{t('title')}</span>
              <input
                value={form.title}
                onChange={setField('title')}
                onBlur={() => handleBlur('title')}
                required
                minLength={3}
                aria-invalid={!!getFieldError('title')}
                aria-describedby={getFieldError('title') ? 'title-error' : undefined}
              />
            </label>
            <span id="title-error" className="field-error" aria-live="polite">
              {touched.title && t(getFieldError('title'))}
            </span>
          </div>
          <div className={`form-field ${getFieldError('description') ? 'has-error' : ''}`}>
            <label>
              <span>{t('descHint')}</span>
              <textarea
                value={form.description}
                onChange={setField('description')}
                onBlur={() => handleBlur('description')}
                required
                minLength={10}
                rows={5}
                aria-invalid={!!getFieldError('description')}
                aria-describedby={getFieldError('description') ? 'description-error' : undefined}
              />
            </label>
            <span id="description-error" className="field-error" aria-live="polite">
              {touched.description && t(getFieldError('description'))}
            </span>
          </div>
          <div className="form-row">
            <div className={`form-field ${getFieldError('price') ? 'has-error' : ''}`}>
              <label>
                <span>{t('priceEur')}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={setField('price')}
                  onBlur={() => handleBlur('price')}
                  required
                  aria-invalid={!!getFieldError('price')}
                  aria-describedby={getFieldError('price') ? 'price-error' : undefined}
                />
              </label>
              <span id="price-error" className="field-error" aria-live="polite">
                {touched.price && t(getFieldError('price'))}
              </span>
            </div>
            <div className={`form-field ${getFieldError('location') ? 'has-error' : ''}`}>
              <label>
                <span>{t('location')}</span>
                <select
                  value={form.location}
                  onChange={setField('location')}
                  onBlur={() => handleBlur('location')}
                  required
                  aria-invalid={!!getFieldError('location')}
                  aria-describedby={getFieldError('location') ? 'location-error' : undefined}
                >
                  <option value="">{t('selectLocation')}</option>
                  {locations.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </label>
              <span id="location-error" className="field-error" aria-live="polite">
                {touched.location && t(getFieldError('location'))}
              </span>
            </div>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>{t('category')}</span>
              <select value={form.category} onChange={setField('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>{t('condition')}</span>
              <select value={form.condition} onChange={setField('condition')}>
                <option value="new">{t('new')}</option>
                <option value="used">{t('used')}</option>
                <option value="refurbished">{t('refurbished')}</option>
              </select>
            </label>
          </div>

          <div className="form-field">
            <span>{t('photosOptional')}</span>
            <p className="products-sub" style={{ margin: '0 0 0.5rem' }}>
              {t('photosHint')}
            </p>
            <ImageUploader
              value={imageEntries}
              onChange={setImageEntries}
              maxFiles={8}
            />
          </div>

          <label className="form-field">
            <span>{t('imageUrlsOptional')}</span>
            <p className="products-sub" style={{ margin: '0 0 0.5rem' }}>
              {t('imageUrlsHint')}
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
              {t('addAnotherUrl')}
            </button>
          </label>

          <div className="specs-edit-block">
            <h3 className="form-section-title">{t('specifications')}</h3>
            <p className="products-sub">{t('specsHint')}</p>
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('publishing') : t('publishListing')}
            </button>
            <Link to="/" className="btn">
              {t('cancel')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
