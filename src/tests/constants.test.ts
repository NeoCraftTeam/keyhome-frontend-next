import { formatDate, formatPrice, formatPriceCompact, formatRelativeDate, truncate } from '@/lib/constants';
import { describe, expect, it } from 'vitest';

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

  // BUG CATCH: Zero is a valid price (e.g., free listings). Showing
  // "Prix non défini" for 0 would confuse users.
  it('formats zero as 0 FCFA (not "Prix non défini")', () => {
    expect(formatPrice(0)).toBe('0 FCFA');
  });

  // BUG CATCH: TypeScript allows `undefined` to slip through via `as any`.
  // This catches the runtime fallback behavior.
  it('returns fallback for undefined (coerced)', () => {
    expect(formatPrice(undefined as unknown as null)).toBe('Prix non défini');
  });

  // BUG CATCH: Negative prices (refunds, adjustments) should still format.
  it('formats negative prices', () => {
    const result = formatPrice(-50000);
    expect(result).toContain('FCFA');
    expect(result).toContain('-');
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

  // BUG CATCH: Zero should display as "0 FCFA", not trigger the k/M path.
  it('formats zero correctly', () => {
    expect(formatPriceCompact(0)).toBe('0 FCFA');
  });

  // BUG CATCH: 999 is below the 1000 threshold — should NOT get "k" suffix.
  it('formats 999 without k suffix', () => {
    expect(formatPriceCompact(999)).toBe('999 FCFA');
  });

  // BUG CATCH: 999_999 is at the boundary between k and M.
  // Should be 1000k, not 1M.
  it('formats 999999 at boundary between k and M', () => {
    expect(formatPriceCompact(999999)).toBe('1000k FCFA');
  });

  // BUG CATCH: undefined coerced through number param.
  it('returns fallback for undefined', () => {
    expect(formatPriceCompact(undefined as unknown as null)).toBe('Prix N/D');
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

  // BUG CATCH: Empty string should return empty, not crash.
  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  // BUG CATCH: maxLength=1 should still produce a valid result.
  it('handles maxLength of 1', () => {
    const result = truncate('Hello', 1);
    expect(result.length).toBeLessThanOrEqual(2); // 'H' + '…'
  });

  // BUG CATCH: Single character at exact boundary.
  it('handles single character exactly at maxLength', () => {
    expect(truncate('A', 1)).toBe('A');
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

  // BUG CATCH: 7 days is the boundary between "days" and "weeks".
  // Off-by-one errors here show "Il y a 7 jours" instead of "Il y a 1 semaine".
  it('returns "Il y a 1 semaine" for 7 days ago', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    expect(formatRelativeDate(sevenDaysAgo)).toBe('Il y a 1 semaine');
  });

  // BUG CATCH: Pluralization — 2+ weeks must be "semaines" not "semaine".
  it('pluralizes weeks correctly', () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(formatRelativeDate(fourteenDaysAgo)).toBe('Il y a 2 semaines');
  });

  // BUG CATCH: 30+ days should fall back to formatDate, not show weeks.
  it('falls back to formatted date for 30+ days', () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 86400000).toISOString();
    const result = formatRelativeDate(fortyDaysAgo);
    // Should be a full date like "19 janvier 2026" (not "Il y a X semaines")
    expect(result).not.toContain('Il y a');
    expect(result).toMatch(/\d{1,2}\s+\w+\s+\d{4}/);
  });

  // BUG CATCH: 6 days ago should still be in "days" range, not "weeks".
  it('returns "Il y a 6 jours" for 6 days ago (boundary before weeks)', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString();
    expect(formatRelativeDate(sixDaysAgo)).toBe('Il y a 6 jours');
  });
});

describe('formatDate', () => {
  // BUG CATCH: formatDate is the final fallback for old dates.
  // Must produce a readable French date.
  it('formats a date in French locale', () => {
    const result = formatDate('2026-01-15T10:30:00Z');
    expect(result).toContain('2026');
    expect(result).toContain('15');
    // Month should be in French (janvier)
    expect(result.toLowerCase()).toContain('janvier');
  });
});
