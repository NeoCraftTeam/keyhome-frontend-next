import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceCompact, formatDate, formatRelativeDate, truncate } from '@/lib/constants';

describe('formatPrice', () => {
  it('formats a standard price with FCFA', () => {
    expect(formatPrice(150000)).toBe('150\u00a0000 FCFA');
  });

  it('returns "Prix non défini" for null', () => {
    expect(formatPrice(null)).toBe('Prix non défini');
  });

  it('formats millions correctly', () => {
    expect(formatPrice(1500000)).toBe('1\u00a0500\u00a0000 FCFA');
  });
});

describe('formatPriceCompact', () => {
  it('formats thousands with k suffix', () => {
    expect(formatPriceCompact(75000)).toBe('75k FCFA');
  });

  it('formats millions with M suffix', () => {
    expect(formatPriceCompact(1500000)).toBe('1,5M FCFA');
  });

  it('formats exact millions without decimals', () => {
    expect(formatPriceCompact(2000000)).toBe('2M FCFA');
  });

  it('formats small amounts as-is', () => {
    expect(formatPriceCompact(500)).toBe('500 FCFA');
  });

  it('returns "Prix N/D" for null', () => {
    expect(formatPriceCompact(null)).toBe('Prix N/D');
  });

  it('formats exact thousands without decimals', () => {
    expect(formatPriceCompact(100000)).toBe('100k FCFA');
  });
});

describe('truncate', () => {
  it('does not truncate short text', () => {
    expect(truncate('Bonjour', 20)).toBe('Bonjour');
  });

  it('truncates long text and appends ellipsis', () => {
    const result = truncate('Appartement T3 Yaoundé Bastos', 15);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(16);
  });

  it('handles exact length boundary', () => {
    expect(truncate('ABC', 3)).toBe('ABC');
  });
});

describe('formatRelativeDate', () => {
  it('returns "Aujourd\'hui" for today', () => {
    const today = new Date().toISOString();
    expect(formatRelativeDate(today)).toBe("Aujourd'hui");
  });

  it('returns "Hier" for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatRelativeDate(yesterday)).toBe('Hier');
  });

  it('returns relative days for recent dates', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe('Il y a 3 jours');
  });
});
