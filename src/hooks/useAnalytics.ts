'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/** UTM parameter keys we capture from the URL. */
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;
type UtmKey = (typeof UTM_KEYS)[number];

/** Session-storage key for persisted UTM data. */
const UTM_STORAGE_KEY = 'kh_utm';

/** @public Funnel event names used across the app. */
export type FunnelEvent =
  | 'ad_view'
  | 'contact_click'
  | 'payment_start'
  | 'payment_complete'
  | 'search_performed'
  | 'filter_applied'
  | 'signup_start'
  | 'signup_complete'
  | 'favorite_added'
  | 'share_clicked';

/**
 * Reads the current UTM params from sessionStorage.
 * Returns null if none have been captured yet.
 */
export function getStoredUtm(): Record<UtmKey, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<UtmKey, string>) : null;
  } catch {
    return null;
  }
}

/**
 * Sends a GA4 event via gtag if available, enriched with persisted UTM data.
 */
export function trackEvent(
  name: FunnelEvent,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  const utm = getStoredUtm();
  const enriched = {
    ...params,
    ...(utm ?? {}),
  };
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, enriched);
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: name, ...enriched });
  }
}

/**
 * Hook that:
 * 1. Captures UTM parameters from the URL on first load and persists them
 *    to sessionStorage so they survive soft-navigations within the session.
 * 2. Exposes a `track()` shorthand wrapping `trackEvent`.
 *
 * Usage:
 * ```tsx
 * const { track } = useAnalytics();
 * track('ad_view', { ad_id: ad.id, city: ad.city });
 * ```
 */
export function useAnalytics() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /** Only capture once per session — don't overwrite on navigations without UTM. */
    const existing = getStoredUtm();

    const captured: Partial<Record<UtmKey, string>> = {};
    let hasAny = false;

    for (const key of UTM_KEYS) {
      const value = searchParams?.get(key);
      if (value) {
        captured[key] = value;
        hasAny = true;
      }
    }

    if (hasAny) {
      const merged = { ...(existing ?? {}), ...captured } as Record<
        UtmKey,
        string
      >;
      try {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // sessionStorage unavailable (private mode, storage full)
      }
    }
  }, [searchParams]);

  const track = useCallback(
    (name: FunnelEvent, params: Record<string, unknown> = {}): void => {
      trackEvent(name, params);
    },
    []
  );

  return { track };
}
