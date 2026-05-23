import {
  AD_FORM_MAP_DEFAULT_LAT,
  initialValues,
} from '@/components/owner/ad-form/types';
import { computeListingQuality } from '@/lib/listingQuality';
import { describe, expect, it } from 'vitest';

const blank = { ...initialValues };

describe('computeListingQuality', () => {
  it('scores 0 on a completely blank form', () => {
    const result = computeListingQuality(blank, 0);
    expect(result.score).toBe(0);
    expect(result.label).toBe('faible');
    expect(result.color).toBe('error');
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('adds 8 pts per photo up to 40 pts maximum', () => {
    expect(computeListingQuality(blank, 1).score).toBe(8);
    expect(computeListingQuality(blank, 3).score).toBe(24);
    expect(computeListingQuality(blank, 5).score).toBe(40);
    expect(computeListingQuality(blank, 10).score).toBe(40);
  });

  it('adds 20 pts for description with ≥ 100 words', () => {
    const shortDesc = { ...blank, description: 'Beau appartement' };
    const longDesc = {
      ...blank,
      description: Array(101).fill('mot').join(' '),
    };
    expect(computeListingQuality(shortDesc, 0).score).toBe(0);
    expect(computeListingQuality(longDesc, 0).score).toBe(20);
  });

  it('adds 15 pts for a non-zero price', () => {
    const withPrice = { ...blank, price: '75000' };
    expect(computeListingQuality(withPrice, 0).score).toBe(15);
  });

  it('does not add price pts when price is 0 or empty', () => {
    expect(computeListingQuality({ ...blank, price: '0' }, 0).score).toBe(0);
    expect(computeListingQuality({ ...blank, price: '' }, 0).score).toBe(0);
  });

  it('adds 10 pts for a non-zero surface', () => {
    const withSurface = { ...blank, surface_area: '60' };
    expect(computeListingQuality(withSurface, 0).score).toBe(10);
  });

  it('adds 10 pts when GPS differs from default', () => {
    const withGps = { ...blank, latitude: 3.866667 };
    expect(computeListingQuality(withGps, 0).score).toBe(10);
  });

  it('does not add GPS pts when latitude equals default', () => {
    const defaultGps = { ...blank, latitude: AD_FORM_MAP_DEFAULT_LAT };
    expect(computeListingQuality(defaultGps, 0).score).toBe(0);
  });

  it('adds 5 pts for a 3D tour', () => {
    expect(computeListingQuality(blank, 0, true).score).toBe(5);
  });

  it('caps score at 100', () => {
    const perfect = {
      ...blank,
      description: Array(101).fill('mot').join(' '),
      price: '100000',
      surface_area: '80',
      latitude: 3.866667,
    };
    const result = computeListingQuality(perfect, 10, true);
    expect(result.score).toBe(100);
    expect(result.label).toBe('excellente');
    expect(result.color).toBe('success');
    expect(result.missing).toHaveLength(0);
  });

  it('returns label correcte for score 40-59', () => {
    // price(15) + surface(10) + GPS(10) + 1 photo(8) = 43
    const values = {
      ...blank,
      price: '100000',
      surface_area: '60',
      latitude: 3.866667,
    };
    const result = computeListingQuality(values, 1);
    expect(result.score).toBe(43);
    expect(result.label).toBe('correcte');
  });

  it('returns label bonne for score 60-79', () => {
    const values = {
      ...blank,
      price: '100000',
      surface_area: '60',
      latitude: 3.866667,
      description: Array(101).fill('mot').join(' '),
    };
    const result = computeListingQuality(values, 0);
    expect(result.score).toBe(55);
    expect(result.label).toBe('correcte');
  });

  it('includes missing hints for each unfulfilled criterion', () => {
    const result = computeListingQuality(blank, 2);
    const hints = result.missing.join(' ');
    expect(hints).toContain('photo');
    expect(hints).toContain('Description');
    expect(hints).toContain('Prix');
    expect(hints).toContain('Surface');
    expect(hints).toContain('carte');
  });

  it('no photo hint when photosCount ≥ 5', () => {
    const result = computeListingQuality(blank, 5);
    expect(result.missing.some((m) => m.includes('photo'))).toBe(false);
  });
});
