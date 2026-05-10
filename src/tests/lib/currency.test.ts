import {
  BASE_CURRENCY,
  convertFromXAF,
  formatCurrency,
  formatCurrencyCompact,
  getCurrencyFromCountry,
  isSupportedCurrency,
  parseSupportedCurrencyCookie,
  resolveDisplayedMoney,
  SUPPORTED_CURRENCIES,
} from '@/lib/currency';
import { describe, expect, it } from 'vitest';

describe('getCurrencyFromCountry', () => {
  it('maps CEMAC countries to XAF', () => {
    expect(getCurrencyFromCountry('CM')).toBe('XAF');
    expect(getCurrencyFromCountry('GA')).toBe('XAF');
    expect(getCurrencyFromCountry('TD')).toBe('XAF');
    expect(getCurrencyFromCountry('CG')).toBe('XAF');
  });

  it('maps UEMOA countries to XOF', () => {
    expect(getCurrencyFromCountry('SN')).toBe('XOF');
    expect(getCurrencyFromCountry('CI')).toBe('XOF');
    expect(getCurrencyFromCountry('ML')).toBe('XOF');
  });

  it('maps Eurozone countries to EUR', () => {
    expect(getCurrencyFromCountry('FR')).toBe('EUR');
    expect(getCurrencyFromCountry('DE')).toBe('EUR');
    expect(getCurrencyFromCountry('ES')).toBe('EUR');
  });

  it('maps non-Eurozone European countries correctly', () => {
    expect(getCurrencyFromCountry('GB')).toBe('GBP');
    expect(getCurrencyFromCountry('CH')).toBe('CHF');
  });

  it('maps Americas correctly', () => {
    expect(getCurrencyFromCountry('US')).toBe('USD');
    expect(getCurrencyFromCountry('CA')).toBe('CAD');
  });

  it('maps African non-FCFA countries', () => {
    expect(getCurrencyFromCountry('NG')).toBe('NGN');
    expect(getCurrencyFromCountry('GH')).toBe('GHS');
    expect(getCurrencyFromCountry('KE')).toBe('KES');
    expect(getCurrencyFromCountry('ZA')).toBe('ZAR');
  });

  it('is case-insensitive', () => {
    expect(getCurrencyFromCountry('fr')).toBe('EUR');
    expect(getCurrencyFromCountry(' Cm ')).toBe('XAF');
  });

  it('falls back to XAF for unknown / empty / nullish input', () => {
    expect(getCurrencyFromCountry('XX')).toBe(BASE_CURRENCY);
    expect(getCurrencyFromCountry('')).toBe(BASE_CURRENCY);
    expect(getCurrencyFromCountry(null)).toBe(BASE_CURRENCY);
    expect(getCurrencyFromCountry(undefined)).toBe(BASE_CURRENCY);
  });
});

describe('isSupportedCurrency', () => {
  it('accepts every entry from SUPPORTED_CURRENCIES', () => {
    for (const code of SUPPORTED_CURRENCIES) {
      expect(isSupportedCurrency(code)).toBe(true);
    }
  });

  it('rejects unknown / empty / nullish values', () => {
    expect(isSupportedCurrency('XYZ')).toBe(false);
    expect(isSupportedCurrency('')).toBe(false);
    expect(isSupportedCurrency(null)).toBe(false);
    expect(isSupportedCurrency(undefined)).toBe(false);
  });
});

describe('parseSupportedCurrencyCookie', () => {
  it('normalises case and spacing', () => {
    expect(parseSupportedCurrencyCookie('eur')).toBe('EUR');
    expect(parseSupportedCurrencyCookie(' usd ')).toBe('USD');
    expect(parseSupportedCurrencyCookie('xaf')).toBe('XAF');
  });

  it('returns null for invalid or empty input', () => {
    expect(parseSupportedCurrencyCookie('')).toBe(null);
    expect(parseSupportedCurrencyCookie(null)).toBe(null);
    expect(parseSupportedCurrencyCookie(undefined)).toBe(null);
    expect(parseSupportedCurrencyCookie('ZZZ')).toBe(null);
  });
});

describe('resolveDisplayedMoney', () => {
  const rates = { EUR: 0.00153, USD: 0.00165 };

  it('keeps XAF / XOF amounts with the visitor currency', () => {
    expect(resolveDisplayedMoney(150_000, 'XAF', null)).toEqual({
      amount: 150_000,
      displayCurrency: 'XAF',
    });
    expect(resolveDisplayedMoney(150_000, 'XOF', null)).toEqual({
      amount: 150_000,
      displayCurrency: 'XOF',
    });
  });

  it('converts when the rate exists', () => {
    expect(resolveDisplayedMoney(150_000, 'EUR', rates).displayCurrency).toBe(
      'EUR'
    );
    expect(resolveDisplayedMoney(150_000, 'EUR', rates).amount).toBeCloseTo(
      229.5,
      1
    );
  });

  it('falls back to XAF display when rates are missing (no false € label)', () => {
    expect(resolveDisplayedMoney(150_000, 'EUR', null)).toEqual({
      amount: 150_000,
      displayCurrency: 'XAF',
    });
    expect(resolveDisplayedMoney(150_000, 'EUR', {})).toEqual({
      amount: 150_000,
      displayCurrency: 'XAF',
    });
  });

  it('returns zero amount for non-finite input', () => {
    expect(resolveDisplayedMoney(Number.NaN, 'EUR', rates)).toEqual({
      amount: 0,
      displayCurrency: 'XAF',
    });
  });
});

describe('convertFromXAF', () => {
  const rates = { EUR: 0.00153, USD: 0.00165, NGN: 2.7 };

  it('returns the input amount when target is XAF or XOF (1:1 peg)', () => {
    expect(convertFromXAF(150_000, 'XAF', rates)).toBe(150_000);
    expect(convertFromXAF(150_000, 'XOF', rates)).toBe(150_000);
  });

  it('multiplies by the rate when target ≠ XAF/XOF', () => {
    expect(convertFromXAF(150_000, 'EUR', rates)).toBeCloseTo(229.5, 1);
    expect(convertFromXAF(150_000, 'USD', rates)).toBeCloseTo(247.5, 1);
    expect(convertFromXAF(150_000, 'NGN', rates)).toBeCloseTo(405_000, 0);
  });

  it('falls back to the input amount when rates are missing', () => {
    expect(convertFromXAF(150_000, 'EUR', null)).toBe(150_000);
    expect(convertFromXAF(150_000, 'EUR', {})).toBe(150_000);
    expect(convertFromXAF(150_000, 'EUR', { USD: 0.00165 })).toBe(150_000);
  });

  it('falls back when the rate is non-positive or non-finite', () => {
    expect(convertFromXAF(150_000, 'EUR', { EUR: 0 })).toBe(150_000);
    expect(convertFromXAF(150_000, 'EUR', { EUR: -1 })).toBe(150_000);
    expect(convertFromXAF(150_000, 'EUR', { EUR: Number.NaN })).toBe(150_000);
  });

  it('returns 0 for non-finite input', () => {
    expect(convertFromXAF(Number.NaN, 'EUR', rates)).toBe(0);
    expect(convertFromXAF(Number.POSITIVE_INFINITY, 'EUR', rates)).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats XAF as integer + FCFA suffix', () => {
    const out = formatCurrency(150_000, 'XAF');
    expect(out).toMatch(/FCFA$/);
    expect(out).toContain('150');
    expect(out).not.toContain('.');
    expect(out).not.toContain(',');
  });

  it('formats XOF the same way as XAF', () => {
    expect(formatCurrency(150_000, 'XOF')).toMatch(/FCFA$/);
  });

  it('formats EUR with the symbol after the amount', () => {
    expect(formatCurrency(229, 'EUR')).toMatch(/€$/);
  });

  it('formats USD with the symbol before the amount', () => {
    expect(formatCurrency(247, 'USD')).toMatch(/^\$/);
  });

  it('formats CAD with CA$ prefix', () => {
    expect(formatCurrency(330, 'CAD')).toMatch(/^CA\$/);
  });

  it('rounds XAF / XOF / JPY to integers', () => {
    expect(formatCurrency(99.7, 'XAF')).toContain('100');
    expect(formatCurrency(99.7, 'JPY')).toContain('100');
  });
});

describe('formatCurrencyCompact', () => {
  // PRODUCT DECISION (May 2026) : the compact formatter no longer truncates
  // amounts to k/M. It now returns the same output as `formatCurrency`,
  // i.e. full digits with locale-appropriate thousand separators.

  it('formats millions with full digits (no M suffix)', () => {
    expect(formatCurrencyCompact(1_500_000, 'XAF')).toBe(
      '1\u00a0500\u00a0000\u00a0FCFA'
    );
    expect(formatCurrencyCompact(2_000_000, 'XAF')).toBe(
      '2\u00a0000\u00a0000\u00a0FCFA'
    );
  });

  it('formats values ≥10 000 with full digits (no k suffix)', () => {
    expect(formatCurrencyCompact(75_000, 'XAF')).toBe('75\u00a0000\u00a0FCFA');
    expect(formatCurrencyCompact(15_000, 'XAF')).toBe('15\u00a0000\u00a0FCFA');
  });

  it('preserves USD-style prefix and en-US separators for $-currencies', () => {
    expect(formatCurrencyCompact(2_500_000, 'USD')).toBe('$2,500,000');
    expect(formatCurrencyCompact(50_000, 'CAD')).toBe('CA$50,000');
  });

  it('matches formatCurrency for small amounts', () => {
    const out = formatCurrencyCompact(500, 'XAF');
    expect(out).toContain('500');
    expect(out).toMatch(/FCFA$/);
  });

  it('formats EUR with comma decimal and 2-digit cents', () => {
    expect(formatCurrencyCompact(60_000.08, 'EUR')).toBe(
      '60\u00a0000,08\u00a0€'
    );
  });
});
