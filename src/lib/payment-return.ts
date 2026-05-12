'use client';

const STORAGE_KEY = 'kh_payment_return_path';

const SKIP_PREFIXES = [
  '/credits/callback',
  '/payment-success',
  '/payment/callback',
  '/payment/return',
];

function shouldSkipRemember(path: string): boolean {
  return SKIP_PREFIXES.some((p) => path.startsWith(p));
}

/**
 * Call immediately before redirecting the user to Flutterwave checkout.
 * After payment, {@link consumePaymentReturnPath} restores this path.
 */
export function rememberPaymentOriginPath(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const path = `${window.location.pathname}${window.location.search}`;
    if (shouldSkipRemember(path)) {
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* ignore */
  }
}

/**
 * Returns the stored path from {@link rememberPaymentOriginPath} and clears storage,
 * or `fallback` if none / invalid.
 */
export function consumePaymentReturnPath(fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (
      raw &&
      raw.startsWith('/') &&
      !raw.startsWith('//') &&
      !shouldSkipRemember(raw)
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
