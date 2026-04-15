import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { FILTER_TO_API, normalizeListing } from '../utils/listingUtils';

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listings, setListings] = useState([]);
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
              'Could not load listings. Is the API running and MongoDB connected?'
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

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="page-home">
      <section className="hero">
        <div className="hero-badge">
          <div className="pulse" />
          Live marketplace · Kosovo &amp; region
        </div>
        <h1>
          The commercial-grade way to trade <span className="accent">tech hardware</span>
        </h1>
        <p className="hero-lead">
          Real listings from the TechTregu API — register, post inventory, and message sellers
          backed by MongoDB and JWT auth.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn">
            Create seller account
          </Link>
          <Link to="/new-listing" className="btn btn-primary">
            Start selling
          </Link>
        </div>
        <ul className="trust-strip">
          <li>
            <span>✓</span> Live REST API
          </li>
          <li>
            <span>✓</span> Secure accounts (JWT)
          </li>
          <li>
            <span>✓</span> Structured specs &amp; pricing
          </li>
        </ul>
      </section>

      <section className="value-strip" aria-label="Why TechTregu">
        <div className="value-card">
          <h3>Production data model</h3>
          <p>Listings, sellers, categories, and conditions map directly to your database schema.</p>
        </div>
        <div className="value-card">
          <h3>Trust by design</h3>
          <p>Every card shows verified seller usernames from real user accounts.</p>
        </div>
        <div className="value-card">
          <h3>Ready to extend</h3>
          <p>Messaging routes and Socket.io are available for chat when you connect the UI.</p>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-head">
          <h2>How it works</h2>
          <p>Three steps from discovery to a confident purchase.</p>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Discover</h3>
            <p>Search and filter by category — queries hit GET /api/listings with real filters.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>Compare</h3>
            <p>Open a listing to see specs, price in EUR, and seller details from the API.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Connect</h3>
            <p>Email the seller in one tap — wire up /api/messages next for in-app chat.</p>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="search-panel">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="search"
              placeholder="Search listings — e.g. RTX 4070, Ryzen 9, DDR5…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="cats-section">
        <p className="section-label">Shop by category</p>
        <div className="cats-grid">
          {[
            { label: 'All', icon: '✦', value: 'all' },
            { label: 'GPU', icon: '🎮', value: 'gpu' },
            { label: 'CPU', icon: '⚡', value: 'cpu' },
            { label: 'PC', icon: '🖥️', value: 'pc' },
            { label: 'RAM', icon: '💾', value: 'ram' },
            { label: 'SSD', icon: '💿', value: 'ssd' },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`cat-chip${activeCategory === cat.value ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              <span className="cat-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="products-header">
          <div>
            <h2>Live listings</h2>
            <p className="products-sub">
              Served from MongoDB via GET /api/listings — create data with POST /api/listings or run{' '}
              <code className="inline-code">npm run seed --prefix server</code>.
            </p>
          </div>
          <span className="count-badge">{loading ? '…' : `${total} live`}</span>
        </div>

        {error && (
          <div className="banner-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="loading-text">Loading listings…</p>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No listings yet</h3>
            <p>
              Seed sample data or sign in and create a listing. Ensure MongoDB is running and the
              server is on port 5000.
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
        ) : (
          <div className="products-grid">
            {listings.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
