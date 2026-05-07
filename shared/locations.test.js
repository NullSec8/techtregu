import { describe, it, expect } from 'vitest';
import { getLocationByCode, getLocations, LOCATIONS } from './locations.js';

describe('locations', () => {
  describe('LOCATIONS', () => {
    it('should export a non-empty array', () => {
      expect(Array.isArray(LOCATIONS)).toBe(true);
      expect(LOCATIONS.length).toBeGreaterThan(0);
    });

    it('should have unique codes', () => {
      const codes = LOCATIONS.map((l) => l.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('should have all required fields in each entry', () => {
      for (const loc of LOCATIONS) {
        expect(loc).toHaveProperty('code');
        expect(loc).toHaveProperty('name');
        expect(loc).toHaveProperty('nameEn');
        expect(typeof loc.code).toBe('string');
        expect(typeof loc.name).toBe('string');
        expect(typeof loc.nameEn).toBe('string');
        expect(loc.code.length).toBeGreaterThan(0);
        expect(loc.name.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getLocationByCode', () => {
    it('should return the correct location for a known code', () => {
      const result = getLocationByCode('pr');
      expect(result).toBeDefined();
      expect(result.code).toBe('pr');
      expect(result.name).toBe('Prishtinë');
      expect(result.nameEn).toBe('Pristina');
    });

    it('should return the correct location for another known code', () => {
      const result = getLocationByCode('gk');
      expect(result).toBeDefined();
      expect(result.code).toBe('gk');
      expect(result.name).toBe('Gjilan');
    });

    it('should return undefined for an unknown code', () => {
      expect(getLocationByCode('xx')).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      expect(getLocationByCode('PR')).toBeUndefined();
      expect(getLocationByCode('Pr')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getLocationByCode('')).toBeUndefined();
    });

    it('should return undefined for null or undefined', () => {
      expect(getLocationByCode(null)).toBeUndefined();
      expect(getLocationByCode(undefined)).toBeUndefined();
    });
  });

  describe('getLocations', () => {
    it('should return an array', () => {
      const result = getLocations();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return the same length as LOCATIONS', () => {
      expect(getLocations().length).toBe(LOCATIONS.length);
    });

    it('should return objects with code and name only (no nameEn)', () => {
      for (const loc of getLocations()) {
        expect(loc).toHaveProperty('code');
        expect(loc).toHaveProperty('name');
        expect(loc).not.toHaveProperty('nameEn');
      }
    });

    it('should not mutate the original LOCATIONS array', () => {
      const originalLength = LOCATIONS.length;
      const result = getLocations();
      expect(result).not.toBe(LOCATIONS);
      expect(LOCATIONS.length).toBe(originalLength);
    });
  });
});
