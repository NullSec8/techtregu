import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { DEFAULT_PAGE_TITLE } from '../siteMeta';
import { FILTER_TO_API, normalizeListing } from '../utils/listingUtils';

export function HomePage() {
  useDocumentTitle(DEFAULT_PAGE_TITLE);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const apiCat = FILTER_TO_API[activeCategory];
        if (apiCat) params.set('category', apiCat);
        if (debouncedSearch) params.set('search', debouncedSearch);
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
  }, [activeCategory, debouncedSearch]);

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
        const results = await Promise.all(
          top.map(async (rid) => {
            try {
              const { data } = await api.get(`/listings/${rid}`);
              return normalizeListing(data);
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setRecentItems(results.filter(Boolean));
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

  const handleSearch = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm.trim());
  };

  const hasActiveFilter = activeCategory !== 'all' || debouncedSearch.length > 0;

  function clearFilters() {
    setActiveCategory('all');
    setSearchTerm('');
  }

  function toggleFavorite(id) {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('tt_favorites', JSON.stringify(next));
      return next;
    });
  }

  const displayedListings = [...listings].sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'popular') return Number(b.views || 0) - Number(a.views || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="page-home">
      <section className="hero">
        <div className="hero-badge">Tech marketplace for Kosovo &amp; region</div>
        <h1>
          Buy and sell <span className="accent">tech hardware</span> with confidence
        </h1>
        <p className="hero-lead">
          Clean listings, direct messaging, and trusted seller profiles. Everything you need to
          trade faster, in one place.
        </p>
        <div className="hero-cta">
          <Link to="/" className="btn btn-primary">
            Start browsing
          </Link>
          <Link to="/new-listing" className="btn">
            Sell your item
          </Link>
        </div>
        <div className="hero-quick-panel">
          <form onSubmit={handleSearch} className="hero-quick-search">
            <input
              type="search"
              placeholder="Search laptops, GPUs, PCs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hero-quick-input"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary">
              Search now
            </button>
          </form>
          <div className="hero-quick-cats">
            {[
              { label: 'All', value: 'all' },
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
        <ul className="trust-strip">
          <li>
            <span>✓</span> Verified seller identities
          </li>
          <li>
            <span>✓</span> Secure accounts
          </li>
          <li>
            <span>✓</span> Offer & message flow
          </li>
        </ul>
      </section>

      <section>
        <div className="products-header">
          <div>
            <h2>Live listings</h2>
            <p className="products-sub">
              Browse the latest hardware deals from trusted local sellers.
            </p>
          </div>
          <div className="products-tools">
            <span className="count-badge">{loading ? '…' : `${total} live`}</span>
            <span className="count-badge count-favorites">★ {favoriteIds.length} favorites</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort listings"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most viewed</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
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
              <h3>No matches</h3>
              <p>Nothing matched your search or category. Try different keywords or browse all listings.</p>
              <p className="empty-actions">
                <button type="button" className="btn btn-primary" onClick={clearFilters}>
                  Clear filters
                </button>
                <Link to="/help" className="btn">
                  Help
                </Link>
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No listings yet</h3>
              <p>
                Be the first to post a listing and start the marketplace momentum.
              </p>
              <p className="empty-actions">
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
                <Link to="/new-listing" className="btn">
                  New listing
                </Link>
              </p>
            </div>
          )
        ) : (
          <div className="products-grid">
            {displayedListings.map((product) => (
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
              <h2>Recently viewed</h2>
              <p className="products-sub">Jump back to items you explored earlier.</p>
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
