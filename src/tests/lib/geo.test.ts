import { describe, expect, it } from 'vitest';
import { formatDistance, haversineDistance } from '@/lib/geo/geo';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(4.0511, 9.7679, 4.0511, 9.7679)).toBe(0);
  });

  it('returns ~157 m between two points 0.001 deg apart along the equator', () => {
    // 1 degree ≈ 111 km, so 0.001 deg ≈ 111 m. At 4° N the cosine
    // factor pulls the longitudinal component slightly tighter; the
    // diagonal of (0.001 lat, 0.001 lng) ends up ≈ 157 m.
    const km = haversineDistance(4.0511, 9.7679, 4.0521, 9.7689);
    expect(km).toBeGreaterThan(0.1);
    expect(km).toBeLessThan(0.2);
  });

  it('returns ~10 km between Douala center and a point 0.1 deg north', () => {
    const km = haversineDistance(4.05, 9.7, 4.15, 9.7);
    expect(km).toBeGreaterThan(11);
    expect(km).toBeLessThan(11.2);
  });

  it('returns NaN when any coordinate is non-finite', () => {
    expect(haversineDistance(NaN, 9.7, 4.05, 9.7)).toBeNaN();
    expect(haversineDistance(4.05, Infinity, 4.05, 9.7)).toBeNaN();
  });
});

describe('formatDistance', () => {
  it('formats sub-kilometre values in metres, rounded', () => {
    expect(formatDistance(0.5)).toBe('500 m');
    expect(formatDistance(0.123)).toBe('123 m');
    expect(formatDistance(0.999)).toBe('999 m');
  });

  it('formats km values 1–99 with one decimal and a French comma', () => {
    expect(formatDistance(3.2)).toBe('3,2 km');
    expect(formatDistance(1.0)).toBe('1,0 km');
    expect(formatDistance(99.4)).toBe('99,4 km');
  });

  it('drops decimals and uses a non-breaking space separator for 100+ km', () => {
    expect(formatDistance(100)).toBe('100 km');
    expect(formatDistance(4623)).toMatch(/^4.623 km$/);
  });

  it('returns em-dash placeholder for invalid input', () => {
    expect(formatDistance(NaN)).toBe('—');
    expect(formatDistance(Infinity)).toBe('—');
    expect(formatDistance(-1)).toBe('—');
  });

  it('returns "0 m" for exactly zero', () => {
    expect(formatDistance(0)).toBe('0 m');
  });
});
