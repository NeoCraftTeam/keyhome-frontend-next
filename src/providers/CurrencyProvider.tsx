'use client';

import {
  CURRENCY_COOKIE,
  CURRENCY_SYMBOLS,
  EXCHANGE_RATES_TTL_MS,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  formatCurrency,
  formatCurrencyCompact,
  isSupportedCurrency,
  parseSupportedCurrencyCookie,
  resolveDisplayedMoney,
} from '@/lib/currency';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface RatePayload {
  base: 'XAF';
  rates: Record<string, number>;
  fetched_at: number;
  source: string;
  stale: boolean;
}

export interface CurrencyContextValue {
  /** Currently active currency (cookie-driven, user-overridable). */
  currency: SupportedCurrency;
  /** Symbol for the active currency (e.g. `€`, `FCFA`). */
  symbol: string;
  /** True until the first rate fetch resolves. */
  isLoading: boolean;
  /**
   * True when the displayed rates are the static fallback snapshot
   * (both FX providers failed). Components rendering converted prices
   * can show a subtle "cours indicatif" hint so users know the value
   * isn't real-time. Always `false` for XAF/XOF (no conversion needed).
   */
  isStale: boolean;
  /** Convert an XAF amount into the active currency. */
  convert: (amountXAF: number) => number;
  /** Convert + format (locale-aware). */
  format: (amountXAF: number) => string;
  /** Compact format ("229 €", "1,5M FCFA") for cards / map labels. */
  formatCompact: (amountXAF: number) => string;
  /** Allow the user to override their currency from the navbar. */
  setCurrency: (next: SupportedCurrency) => void;
  /** All supported currencies (ordered, for selector UIs). */
  supported: readonly SupportedCurrency[];
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** Read a cookie client-side. Returns undefined when missing or on the server. */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const target = `${name}=`;
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(target))
      return decodeURIComponent(part.slice(target.length));
  }
  return undefined;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

const RATES_CACHE_KEY = 'kh_exchange_rates_v1';

interface CachedRates {
  rates: Record<string, number>;
  fetched_at: number;
}

function readCachedRates(): CachedRates | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRates;
    if (
      typeof parsed.fetched_at !== 'number' ||
      typeof parsed.rates !== 'object' ||
      Date.now() - parsed.fetched_at > EXCHANGE_RATES_TTL_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedRates(rates: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedRates = { rates, fetched_at: Date.now() };
    window.localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage unavailable (private mode, quota) — silently ignore. */
  }
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Optional SSR seed (read from cookies in a Server Component). */
  initialCurrency?: SupportedCurrency;
}

/**
 * Provides currency state to the visitor-facing UI. The owner panel does
 * **not** wrap with this provider — bailleurs always saisissent et voient
 * leurs prix en FCFA (la BDD est XAF).
 */
export function CurrencyProvider({
  children,
  initialCurrency,
}: CurrencyProviderProps) {
  // Resolve the initial currency once, from cookie / SSR seed / default.
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    if (initialCurrency && isSupportedCurrency(initialCurrency)) {
      return initialCurrency;
    }
    if (typeof document !== 'undefined') {
      const parsed = parseSupportedCurrencyCookie(readCookie(CURRENCY_COOKIE));
      if (parsed) {
        return parsed;
      }
    }
    return 'XAF';
  });

  const [rates, setRates] = useState<Record<string, number> | null>(() => {
    const cached = readCachedRates();
    return cached?.rates ?? null;
  });
  const [isLoading, setIsLoading] = useState(
    currency !== 'XAF' && rates === null
  );
  const [isStale, setIsStale] = useState(false);

  // Fetch /api/exchange-rates on mount (only when needed: any non-XAF
  // currency requires a rate). XAF & XOF visitors skip the network entirely.
  useEffect(() => {
    if (currency === 'XAF' || currency === 'XOF') {
      setIsLoading(false);
      setIsStale(false);
      return;
    }
    const cached = readCachedRates();
    if (cached) {
      setRates(cached.rates);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/exchange-rates', { credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as RatePayload;
        if (cancelled) return;
        setRates(data.rates);
        setIsStale(Boolean(data.stale));
        writeCachedRates(data.rates);
      } catch {
        // Network error → rates stay null → format() uses resolveDisplayedMoney
        // and falls back to XAF so we never mis-label CFA as EUR/USD.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currency]);

  const setCurrency = useCallback((next: SupportedCurrency) => {
    if (!isSupportedCurrency(next)) return;
    setCurrencyState(next);
    // 30-day persistence for explicit user choice — overrides geo detection.
    writeCookie(CURRENCY_COOKIE, next, 60 * 60 * 24 * 30);
  }, []);

  const convert = useCallback(
    (amountXAF: number) =>
      resolveDisplayedMoney(amountXAF, currency, rates).amount,
    [currency, rates]
  );

  const format = useCallback(
    (amountXAF: number) => {
      const { amount, displayCurrency } = resolveDisplayedMoney(
        amountXAF,
        currency,
        rates
      );
      return formatCurrency(amount, displayCurrency);
    },
    [currency, rates]
  );

  const formatCompact = useCallback(
    (amountXAF: number) => {
      const { amount, displayCurrency } = resolveDisplayedMoney(
        amountXAF,
        currency,
        rates
      );
      return formatCurrencyCompact(amount, displayCurrency);
    },
    [currency, rates]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      symbol: CURRENCY_SYMBOLS[currency],
      isLoading,
      isStale,
      convert,
      format,
      formatCompact,
      setCurrency,
      supported: SUPPORTED_CURRENCIES,
    }),
    [currency, isLoading, isStale, convert, format, formatCompact, setCurrency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Synchronous formatter for non-React contexts (e.g. Mapbox popups whose
 * HTML is built outside the React tree). Reads the active currency from the
 * `kh_currency` cookie and the cached rates from localStorage — both of
 * which the `CurrencyProvider` keeps fresh (1 h TTL).
 *
 * Falls back to `formatCurrency(amount, 'XAF')` whenever any prerequisite
 * is missing (SSR, private mode, no rates yet, unknown currency).
 */
export function formatVisitorPrice(amountXAF: number): string {
  if (typeof document === 'undefined') {
    return formatCurrency(amountXAF, 'XAF');
  }
  const selected =
    parseSupportedCurrencyCookie(readCookie(CURRENCY_COOKIE)) ?? 'XAF';
  const cached = readCachedRates();
  const { amount, displayCurrency } = resolveDisplayedMoney(
    amountXAF,
    selected,
    cached?.rates ?? null
  );
  return formatCurrency(amount, displayCurrency);
}

/**
 * `useCurrency` — read the active currency state from anywhere under
 * `<CurrencyProvider>`. Returns a safe no-op fallback (FCFA, identity
 * conversion) when the provider is missing, so individual components never
 * crash if rendered in an isolated context (Storybook, tests).
 */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  // Safe fallback — keeps the UI rendering FCFA when used outside the provider.
  return {
    currency: 'XAF',
    symbol: CURRENCY_SYMBOLS.XAF,
    isLoading: false,
    isStale: false,
    convert: (amountXAF: number) => amountXAF,
    format: (amountXAF: number) => formatCurrency(amountXAF, 'XAF'),
    formatCompact: (amountXAF: number) =>
      formatCurrencyCompact(amountXAF, 'XAF'),
    setCurrency: () => undefined,
    supported: SUPPORTED_CURRENCIES,
  };
}
