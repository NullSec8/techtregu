import { describe, it, expect, vi } from 'vitest';

// Mock all external dependencies to prevent real DB access
vi.mock('dotenv', () => ({ config: vi.fn() }));
vi.mock('bcryptjs', () => ({ genSalt: vi.fn(), hash: vi.fn() }));
vi.mock('mysql2/promise', () => ({ createPool: vi.fn() }));
vi.mock('./database/bootstrap', () => ({ ensureDatabase: vi.fn() }));
vi.mock('./database/initSchema', () => ({ initSchema: vi.fn() }));

import { DEMO, LISTINGS, run } from './seed.js';

describe('seed — DEMO object', () => {
  it('exports DEMO as an object', () => {
    expect(DEMO).toBeDefined();
    expect(typeof DEMO).toBe('object');
    expect(DEMO).not.toBeNull();
  });

  it('has all required fields', () => {
    expect(DEMO).toHaveProperty('username');
    expect(DEMO).toHaveProperty('email');
    expect(DEMO).toHaveProperty('password');
    expect(DEMO).toHaveProperty('firstName');
    expect(DEMO).toHaveProperty('lastName');
    expect(DEMO).toHaveProperty('location');
  });

  it('has expected demo values', () => {
    expect(DEMO.username).toBe('techtregu_demo');
    expect(DEMO.email).toBe('demo@techtregu.com');
    expect(DEMO.password).toBe('DemoPass123');
    expect(DEMO.firstName).toBe('Demo');
    expect(DEMO.lastName).toBe('Seller');
    expect(DEMO.location).toBe('Prishtina, Kosovo');
  });

  it('has all string fields with non-zero length', () => {
    const fields = ['username', 'email', 'password', 'firstName', 'lastName', 'location'];
    for (const field of fields) {
      expect(typeof DEMO[field]).toBe('string');
      expect(DEMO[field].length).toBeGreaterThan(0);
    }
  });
});

describe('seed — LISTINGS array', () => {
  it('exports LISTINGS as a non-empty array', () => {
    expect(Array.isArray(LISTINGS)).toBe(true);
    expect(LISTINGS.length).toBeGreaterThan(0);
  });

  it('has exactly 28 listings', () => {
    expect(LISTINGS).toHaveLength(28);
  });

  it('every listing has all required fields', () => {
    const requiredFields = ['title', 'description', 'price', 'category', 'condition', 'location', 'images', 'specs'];
    for (const listing of LISTINGS) {
      for (const field of requiredFields) {
        expect(listing).toHaveProperty(field);
      }
    }
  });

  it('every listing has a non-empty title and description', () => {
    for (const listing of LISTINGS) {
      expect(listing.title.length).toBeGreaterThan(0);
      expect(listing.description.length).toBeGreaterThan(0);
    }
  });

  it('every listing has a positive price', () => {
    for (const listing of LISTINGS) {
      expect(typeof listing.price).toBe('number');
      expect(listing.price).toBeGreaterThan(0);
    }
  });

  it('every listing has a valid category', () => {
    const validCategories = ['laptop', 'desktop', 'gpu', 'cpu', 'ram', 'storage', 'monitor', 'peripheral', 'other'];
    for (const listing of LISTINGS) {
      expect(validCategories).toContain(listing.category);
    }
  });

  it('every listing has a valid condition', () => {
    const validConditions = ['new', 'used', 'refurbished'];
    for (const listing of LISTINGS) {
      expect(validConditions).toContain(listing.condition);
    }
  });

  it('every listing has a non-empty location', () => {
    for (const listing of LISTINGS) {
      expect(listing.location.length).toBeGreaterThan(0);
    }
  });

  it('every listing has images as a non-empty array of strings', () => {
    for (const listing of LISTINGS) {
      expect(Array.isArray(listing.images)).toBe(true);
      expect(listing.images.length).toBeGreaterThan(0);
      for (const img of listing.images) {
        expect(typeof img).toBe('string');
        expect(img.startsWith('http')).toBe(true);
      }
    }
  });

  it('every listing has specs as a non-null object', () => {
    for (const listing of LISTINGS) {
      expect(listing.specs).toBeDefined();
      expect(typeof listing.specs).toBe('object');
      expect(listing.specs).not.toBeNull();
      expect(Array.isArray(listing.specs)).toBe(false);
    }
  });

  it('has unique titles (no duplicates)', () => {
    const titles = LISTINGS.map((l) => l.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('has titles that are all non-empty strings', () => {
    for (const listing of LISTINGS) {
      expect(typeof listing.title).toBe('string');
      expect(listing.title.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('seed — run function', () => {
  it('exports run as a function', () => {
    expect(typeof run).toBe('function');
  });

  it('is an async function', () => {
    expect(run.constructor.name).toBe('AsyncFunction');
  });
});
