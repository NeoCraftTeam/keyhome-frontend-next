import { NextResponse } from 'next/server';

/**
 * GET /api/exchange-rates
 *
 * Returns a JSON payload `{ base: 'XAF', rates: { EUR: 0.00153, ... }, fetched_at: 1717... }`.
 *
 * Strategy:
 *  - **Server-side fetch only** — the API key (`EXCHANGE_API_KEY`) never leaves
 *    the server, so it can't be scraped from the browser bundle.
 *  - **1-hour cache** via `next: { revalidate: 3600 }` → at most ~720 calls/month
 *    even with high traffic, well under the 1 500/month free tier of
 *    exchangerate-api.com.
 *  - **Keyless fallback** to `open.er-api.com` (no quota) when the API key is
 *    not configured or the primary provider fails. Guarantees the feature
 *    keeps working in dev / preview environments.
 *  - **Hard fallback** to a static rate snapshot so prices never break the UI;
 *    the snapshot is conservative (rounded down) and clearly labelled as
 *    `stale` in the response body.
 */

const REVALIDATE_SECONDS = 60 * 60; // 1 hour

// Static snapshot, used only if both online providers fail.
// Approximate rates from XAF as of late 2024 — intentionally conservative.
// Source : exchangerate-api.com snapshot.
const STATIC_FALLBACK_RATES: Record<string, number> = {
  XAF: 1,
  XOF: 1,
  EUR: 0.001524,
  USD: 0.001647,
  GBP: 0.001302,
  CHF: 0.001478,
  CAD: 0.002282,
  NGN: 2.704,
  GHS: 0.02575,
  KES: 0.2129,
  ZAR: 0.03007,
  AED: 0.006048,
  CNY: 0.01191,
  JPY: 0.2545,
  INR: 0.1392,
};

interface RateResponse {
  base: string;
  rates: Record<string, number>;
  fetched_at: number;
  source: 'exchangerate-api' | 'open.er-api' | 'static-fallback';
  stale: boolean;
}

async function fetchFromExchangeRateApi(
  apiKey: string
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/XAF`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      conversion_rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.conversion_rates) return null;
    return data.conversion_rates;
  } catch {
    return null;
  }
}

async function fetchFromOpenErApi(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/XAF', {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.rates) return null;
    return data.rates;
  } catch {
    return null;
  }
}

export async function GET() {
  const apiKey = process.env.EXCHANGE_API_KEY?.trim();
  let rates: Record<string, number> | null = null;
  let source: RateResponse['source'] = 'static-fallback';

  if (apiKey) {
    rates = await fetchFromExchangeRateApi(apiKey);
    if (rates) source = 'exchangerate-api';
  }

  if (!rates) {
    rates = await fetchFromOpenErApi();
    if (rates) source = 'open.er-api';
  }

  const stale = rates === null;
  const finalRates = rates ?? STATIC_FALLBACK_RATES;

  const body: RateResponse = {
    base: 'XAF',
    rates: finalRates,
    fetched_at: Date.now(),
    source,
    stale,
  };

  return NextResponse.json(body, {
    headers: {
      // Browsers respect this; CDNs honour s-maxage.
      'Cache-Control': stale
        ? 'public, max-age=60, s-maxage=60'
        : `public, max-age=${REVALIDATE_SECONDS}, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}
