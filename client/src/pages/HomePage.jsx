import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import { AutocompleteSearch } from '../components/AutocompleteSearch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { DEFAULT_PAGE_TITLE } from '../siteMeta';
import { FILTER_TO_API, normalizeListing } from '../utils/listingUtils';

const SORT_TO_API = {
  'newest': 'newest',
  'popular': 'most_viewed',
  'price-low': 'price_asc',
  'price-high': 'price_desc',
};
import { useI18n } from '../context/I18nProvider';

export function HomePage() {
  const { t } = useI18n();
  useDocumentTitle(DEFAULT_PAGE_TITLE);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
  const [listings, setListings] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem('tt_favorites');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMinPrice(minPrice.trim()), 350);
    return () => clearTimeout(t);
  }, [minPrice]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMaxPrice(maxPrice.trim()), 350);
    return () => clearTimeout(t);
  }, [maxPrice]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const apiCat = FILTER_TO_API[activeCategory];
        if (apiCat) params.set('category', apiCat);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
        if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
        const apiSort = SORT_TO_API[sortBy] || 'newest';
        params.set('sortBy', apiSort);
        params.set('limit', '48');

        const { data } = await api.get(`/listings?${params.toString()}`);
        if (cancelled) return;
        const items = (data.listings || []).map(normalizeListing);
        setListings(items);
        setTotal(data.total ?? items.length);
      } catch (e) {
        if (!cancelled) {
          setError(
            e.response?.data?.message ||
              e.message ||
              'Could not load listings. Is the API running and MySQL configured?'
          );
          setListings([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, sortBy]);

  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      try {
        const raw = localStorage.getItem('tt_recently_viewed');
        const ids = raw ? JSON.parse(raw) : [];
        const top = ids.slice(0, 8);
        if (!top.length) {
          if (!cancelled) setRecentItems([]);
          return;
        }
        const { data } = await api.get(`/listings/batch?ids=${top.join(',')}`);
        if (cancelled) return;
        setRecentItems((data.listings || []).map(normalizeListing));
      } catch {
        if (!cancelled) setRecentItems([]);
      }
    }

    function refreshOnFocus() {
      if (document.visibilityState !== 'hidden') {
        loadRecent();
      }
    }

    loadRecent();
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  const hasActiveFilter = activeCategory !== 'all' || debouncedSearch.length > 0 || debouncedMinPrice || debouncedMaxPrice;

  function clearFilters() {
    setActiveCategory('all');
    setSearchTerm('');
    setDebouncedSearch('');
    setMinPrice('');
    setMaxPrice('');
    setDebouncedMinPrice('');
    setDebouncedMaxPrice('');
  }

  function toggleFavorite(id) {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('tt_favorites', JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="page-home">
      <section className="hero">
        <h1>
          {t('heroTitle')} <span className="accent">{t('heroAccent')}</span> {t('heroTrailer')}
        </h1>
        <p className="hero-lead">
          {t('heroLead')}
        </p>
        <div className="hero-cta">
          <Link to="/" className="btn btn-primary">
            {t('startBrowsing')}
          </Link>
          <Link to="/new-listing" className="btn">
            {t('sellYourItem')}
          </Link>
        </div>
        <div className="hero-quick-panel">
          <div className="hero-quick-search">
            <AutocompleteSearch />
          </div>
          <div className="hero-quick-cats">
            {[
              { label: t('all'), value: 'all' },
              { label: 'GPU', value: 'gpu' },
              { label: 'CPU', value: 'cpu' },
              { label: 'PC', value: 'pc' },
              { label: 'RAM', value: 'ram' },
              { label: 'SSD', value: 'ssd' },
            ].map((cat) => (
              <button
                key={`hero-${cat.value}`}
                type="button"
                className={`hero-chip${activeCategory === cat.value ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="products-header">
          <div>
            <h2>{t('liveListings')}</h2>
            <p className="products-sub">
              {t('browseDeals')}
            </p>
          </div>
          <div className="products-tools">
            <span className="count-badge">{loading ? '…' : `${total} ${t('live')}`}</span>
            <span className="price-filter">
              <input
                type="number"
                placeholder={`${t('minPrice')} €`}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="price-input"
                min="0"
              />
              <span>-</span>
              <input
                type="number"
                placeholder={`${t('maxPrice')} €`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="price-input"
                min="0"
              />
            </span>
            <span className="count-badge count-favorites">★ {favoriteIds.length} {t('favorites').toLowerCase()}</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t('sortBy')}
            >
              <option value="newest">{t('newest')}</option>
              <option value="popular">{t('popular')}</option>
              <option value="price-low">{t('priceLowToHigh')}</option>
              <option value="price-high">{t('priceHighToLow')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="banner-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <ProductSkeletonGrid count={8} />
        ) : listings.length === 0 ? (
          hasActiveFilter ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>{t('noResults')}</h3>
              <p>{t('noMatchesDesc')}</p>
              <p className="empty-actions">
                <button type="button" className="btn btn-primary" onClick={clearFilters}>
                  {t('clearFilters')}
                </button>
                <Link to="/help" className="btn">
                  {t('help')}
                </Link>
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>{t('noListings')}</h3>
              <p>
                {t('firstToListing')}
              </p>
              <p className="empty-actions">
                <Link to="/register" className="btn btn-primary">
                  {t('register')}
                </Link>
                <Link to="/new-listing" className="btn">
                  {t('createListing')}
                </Link>
              </p>
            </div>
          )
        ) : (
          <div className="products-grid">
            {listings.map((product) => (
              <ProductCard
                product={product}
                key={product.id}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {recentItems.length > 0 && (
        <section className="recently-viewed-section">
          <div className="products-header">
            <div>
              <h2>{t('recentlyViewed')}</h2>
              <p className="products-sub">{t('jumpBack')}</p>
            </div>
          </div>
          <div className="products-grid">
            {recentItems.map((item) => (
              <ProductCard
                key={`recent-${item.id}`}
                product={item}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
