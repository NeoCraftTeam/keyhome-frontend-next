/**
 * Currency configuration & helpers.
 *
 * Single source of truth for:
 *  - Country → currency mapping (ISO 3166-1 alpha-2 → ISO 4217)
 *  - Currency symbols & display labels
 *  - Locale-aware formatting (uses `Intl.NumberFormat`)
 *  - Conversion from XAF (the canonical price stored in the backend) to any
 *    target currency given a rate table.
 *
 * **Rule absolue** : the database always stores prices in XAF (FCFA). Any
 * non-XAF display is a *visualisation* — payments still happen in FCFA.
 */

export const BASE_CURRENCY = 'XAF' as const;

/** ISO 4217 codes we explicitly support in the UI selector. */
export const SUPPORTED_CURRENCIES = [
  // Afrique CFA
  'XAF', // Franc CFA Afrique Centrale (CEMAC)
  'XOF', // Franc CFA Afrique Ouest (UEMOA)
  // Afrique non-CFA
  'NGN',
  'GHS',
  'KES',
  'ZAR',
  'MAD',
  'EGP',
  // Europe
  'EUR',
  'GBP',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  // Amériques
  'USD',
  'CAD',
  'BRL',
  'MXN',
  // Moyen-Orient
  'AED',
  'SAR',
  'TRY',
  // Asie / Océanie
  'CNY',
  'JPY',
  'KRW',
  'INR',
  'AUD',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Display symbol per currency (used on the right or left of the amount). */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  XAF: 'FCFA',
  XOF: 'FCFA',
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'CA$',
  NGN: '₦',
  GHS: 'GH₵',
  KES: 'KSh',
  ZAR: 'R',
  AED: 'د.إ',
  CNY: '¥',
  JPY: '¥',
  INR: '₹',
  MAD: 'DH',
  EGP: 'E£',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  BRL: 'R$',
  MXN: 'MX$',
  SAR: 'SAR',
  TRY: '₺',
  KRW: '₩',
  AUD: 'A$',
};

/** Human-friendly label shown in the currency selector dropdown. */
export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  XAF: 'Franc CFA (CEMAC)',
  XOF: 'Franc CFA (UEMOA)',
  EUR: 'Euro',
  USD: 'Dollar US',
  GBP: 'Livre Sterling',
  CHF: 'Franc Suisse',
  CAD: 'Dollar Canadien',
  NGN: 'Naira Nigérian',
  GHS: 'Cedi Ghanéen',
  KES: 'Shilling Kényan',
  ZAR: 'Rand Sud-Africain',
  AED: 'Dirham EAU',
  CNY: 'Yuan Chinois',
  JPY: 'Yen Japonais',
  INR: 'Roupie Indienne',
  MAD: 'Dirham Marocain',
  EGP: 'Livre Égyptienne',
  SEK: 'Couronne Suédoise',
  NOK: 'Couronne Norvégienne',
  DKK: 'Couronne Danoise',
  PLN: 'Złoty Polonais',
  BRL: 'Real Brésilien',
  MXN: 'Peso Mexicain',
  SAR: 'Riyal Saoudien',
  TRY: 'Livre Turque',
  KRW: 'Won Sud-Coréen',
  AUD: 'Dollar Australien',
};

/**
 * Flag emoji for the **representative country** of each currency. Used as a
 * visual anchor in the dropdown — Cameroon flag for XAF, France for EUR, etc.
 * For multi-country currencies (EUR, XAF, XOF) we pick the most populated
 * member as a recognisable proxy.
 */
export const CURRENCY_FLAGS: Record<SupportedCurrency, string> = {
  XAF: '🇨🇲', // Cameroun
  XOF: '🇸🇳', // Sénégal
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  CHF: '🇨🇭',
  CAD: '🇨🇦',
  NGN: '🇳🇬',
  GHS: '🇬🇭',
  KES: '🇰🇪',
  ZAR: '🇿🇦',
  AED: '🇦🇪',
  CNY: '🇨🇳',
  JPY: '🇯🇵',
  INR: '🇮🇳',
  MAD: '🇲🇦',
  EGP: '🇪🇬',
  SEK: '🇸🇪',
  NOK: '🇳🇴',
  DKK: '🇩🇰',
  PLN: '🇵🇱',
  BRL: '🇧🇷',
  MXN: '🇲🇽',
  SAR: '🇸🇦',
  TRY: '🇹🇷',
  KRW: '🇰🇷',
  AUD: '🇦🇺',
};

/** Region grouping used in the selector UI. */
export const CURRENCY_REGIONS: Record<
  'africa' | 'europe' | 'americas' | 'middle_east' | 'asia_oceania',
  { label: string; codes: readonly SupportedCurrency[] }
> = {
  africa: {
    label: 'Afrique',
    codes: ['XAF', 'XOF', 'NGN', 'GHS', 'KES', 'ZAR', 'MAD', 'EGP'],
  },
  europe: {
    label: 'Europe',
    codes: ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN'],
  },
  americas: {
    label: 'Amériques',
    codes: ['USD', 'CAD', 'BRL', 'MXN'],
  },
  middle_east: {
    label: 'Moyen-Orient',
    codes: ['AED', 'SAR', 'TRY'],
  },
  asia_oceania: {
    label: 'Asie / Océanie',
    codes: ['CNY', 'JPY', 'KRW', 'INR', 'AUD'],
  },
};

/**
 * Country (ISO 3166-1 alpha-2) → currency (ISO 4217).
 * Defaults to XAF when the country is unknown.
 */
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // Zone CEMAC (FCFA Afrique Centrale)
  CM: 'XAF',
  CG: 'XAF',
  GA: 'XAF',
  TD: 'XAF',
  CF: 'XAF',
  GQ: 'XAF',
  // Zone UEMOA (FCFA Afrique Ouest)
  SN: 'XOF',
  CI: 'XOF',
  ML: 'XOF',
  BF: 'XOF',
  BJ: 'XOF',
  TG: 'XOF',
  NE: 'XOF',
  GW: 'XOF',
  // Autres Afrique
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  // Eurozone (extrait — toutes redirigent EUR)
  FR: 'EUR',
  DE: 'EUR',
  BE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  LU: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  // Europe non-EUR
  GB: 'GBP',
  CH: 'CHF',
  // Amériques
  US: 'USD',
  CA: 'CAD',
  // Maghreb / Afrique du Nord
  MA: 'MAD',
  EG: 'EGP',
  TN: 'EUR', // Tunisie : pas de TND ici, fallback EUR (devises principales tourisme)
  DZ: 'EUR', // Algérie : idem
  // Amériques élargies
  BR: 'BRL',
  MX: 'MXN',
  AR: 'USD', // Argentine : ARS très volatile, fallback USD
  CL: 'USD',
  // Moyen-Orient
  AE: 'AED',
  SA: 'SAR',
  TR: 'TRY',
  QA: 'AED', // Riyal qatari ≈ USD, fallback AED régional
  KW: 'AED',
  // Asie / Océanie
  CN: 'CNY',
  HK: 'USD',
  TW: 'USD',
  JP: 'JPY',
  KR: 'KRW',
  IN: 'INR',
  AU: 'AUD',
  NZ: 'AUD',
  SG: 'USD',
  // Europe — non-EUR
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  // Eurozone élargie
  CZ: 'EUR', // CZK volatile, fallback EUR
  HU: 'EUR',
  RO: 'EUR',
  BG: 'EUR',
};

/** Resolve a country code (case-insensitive) to its supported currency. */
export function getCurrencyFromCountry(
  countryCode: string | null | undefined
): SupportedCurrency {
  if (!countryCode) return BASE_CURRENCY;
  const code = countryCode.trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[code] ?? BASE_CURRENCY;
}

/** Type-guard: is `code` one of our supported currencies? */
export function isSupportedCurrency(
  code: string | null | undefined
): code is SupportedCurrency {
  return (
    typeof code === 'string' &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(code)
  );
}

/**
 * Normalise a cookie / query value to a supported ISO code (uppercase) or null.
 * Accepts e.g. "eur", " EUR " from hand-edited cookies.
 */
export function parseSupportedCurrencyCookie(
  raw: string | null | undefined
): SupportedCurrency | null {
  if (raw == null || raw === '') {
    return null;
  }
  const code = raw.trim().toUpperCase();

  return isSupportedCurrency(code) ? code : null;
}

/**
 * How much to show and in which currency code, given XAF backend amounts.
 * When conversion is impossible (missing rate), falls back to displaying XAF
 * so we never show a CFA amount with a foreign symbol (e.g. "150 000 €").
 */
export function resolveDisplayedMoney(
  amountXAF: number,
  target: SupportedCurrency,
  rates: Record<string, number> | null | undefined
): { amount: number; displayCurrency: SupportedCurrency } {
  if (!Number.isFinite(amountXAF)) {
    return { amount: 0, displayCurrency: 'XAF' };
  }
  if (target === 'XAF' || target === 'XOF') {
    return { amount: amountXAF, displayCurrency: target };
  }
  const rate = rates?.[target];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return { amount: amountXAF, displayCurrency: 'XAF' };
  }

  return { amount: amountXAF * rate, displayCurrency: target };
}

/**
 * Convert an amount from XAF to `target` using a rate table whose **base is
 * XAF** (e.g. `rates['EUR'] = 0.00153` ⇒ 1 XAF = 0.00153 EUR).
 *
 * Returns the original amount when:
 *  - `target` is XAF or XOF (XOF is pegged 1:1 with XAF in CFA franc zone)
 *  - the rates table is missing / empty
 *  - the target currency has no rate
 */
export function convertFromXAF(
  amountXAF: number,
  target: SupportedCurrency,
  rates: Record<string, number> | null | undefined
): number {
  if (!Number.isFinite(amountXAF)) return 0;
  // XAF and XOF are pegged 1:1 → no conversion, no API hit needed.
  if (target === 'XAF' || target === 'XOF') return amountXAF;
  if (!rates) return amountXAF;
  const rate = rates[target];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return amountXAF;
  return amountXAF * rate;
}

/**
 * Format an amount in the given currency using locale-appropriate rules.
 *
 * Decisions:
 *  - **XAF / XOF** → integers only (FCFA never uses decimals in real life).
 *  - **JPY** → integers only.
 *  - **EUR / GBP / CHF** → `fr-FR` locale, symbol after.
 *  - **USD / CAD** → `en-US`, symbol before.
 *  - Other → `fr-FR`, symbol after.
 *
 * The `fr-FR` locale yields narrow no-break spaces (U+202F) — we normalise
 * them to regular non-breaking spaces (U+00A0) for consistent rendering
 * across browsers.
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = CURRENCY_SYMBOLS[currency];

  // Integer-only currencies (no fractional units in everyday usage).
  const noDecimals =
    currency === 'XAF' ||
    currency === 'XOF' ||
    currency === 'JPY' ||
    currency === 'KRW';
  const value = noDecimals ? Math.round(amount) : amount;

  // Currencies whose convention is symbol BEFORE the amount (en-US style).
  const prefixSymbol =
    currency === 'USD' ||
    currency === 'CAD' ||
    currency === 'AUD' ||
    currency === 'MXN' ||
    currency === 'BRL' ||
    currency === 'CNY' ||
    currency === 'JPY' ||
    currency === 'KRW';

  if (prefixSymbol) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: noDecimals ? 0 : 0,
      maximumFractionDigits: noDecimals ? 0 : 2,
    }).format(value);
    return `${symbol}${formatted}`;
  }

  const locale =
    currency === 'EUR' || currency === 'GBP' || currency === 'CHF'
      ? 'fr-FR'
      : 'fr-FR';

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })
    .format(value)
    .replace(/\u202f/g, '\u00a0');

  return `${formatted} ${symbol}`;
}

/**
 * Compact format for cards / map labels (e.g. "229 €", "1,5M FCFA").
 */
export function formatCurrencyCompact(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const noDecimals =
    currency === 'XAF' ||
    currency === 'XOF' ||
    currency === 'JPY' ||
    currency === 'KRW';
  const prefixSymbol =
    currency === 'USD' ||
    currency === 'CAD' ||
    currency === 'AUD' ||
    currency === 'MXN' ||
    currency === 'BRL' ||
    currency === 'CNY' ||
    currency === 'JPY' ||
    currency === 'KRW';

  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const formatted = m % 1 === 0 ? `${m}` : m.toFixed(1).replace('.', ',');
    return prefixSymbol ? `${symbol}${formatted}M` : `${formatted}M ${symbol}`;
  }
  if (amount >= 10_000) {
    const k = Math.round(amount / 1_000);
    return prefixSymbol ? `${symbol}${k}k` : `${k}k ${symbol}`;
  }
  return formatCurrency(noDecimals ? Math.round(amount) : amount, currency);
}

/**
 * Cookie names — kept short to minimise overhead per request.
 * Set by the Next.js middleware from the `CF-IPCountry` header.
 */
export const CURRENCY_COOKIE = 'kh_currency';
export const COUNTRY_COOKIE = 'kh_country';

/** TTL of currency cookies in seconds (24 h). */
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * TTL of the in-browser exchange-rates cache (1 hour). Aligns with the
 * server-side `revalidate` of `/api/exchange-rates` so a cold tab gets a
 * fresh response at most once per hour, regardless of how long the tab
 * has been open.
 */
export const EXCHANGE_RATES_TTL_MS = 60 * 60 * 1000;
