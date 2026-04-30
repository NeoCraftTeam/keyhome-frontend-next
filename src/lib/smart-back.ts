'use client';

import type { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;

/**
 * Auth pages whose presence in browser history would land the user back at
 * a login screen — undesirable when the user reached the current page after
 * authenticating. The smart-back logic skips these and uses the fallback.
 */
const AUTH_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-phone',
  '/forgot-password',
  '/reset-password',
];

function isAuthPath(href: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return true;
    return AUTH_PATHS.some((p) => url.pathname.startsWith(p));
  } catch {
    return false;
  }
}

/**
 * Navigate back if the previous page in browser history is a safe in-app
 * page. Otherwise, replace history with the provided fallback so the user
 * never bounces back to an auth screen by accident.
 *
 * Heuristic:
 * - `document.referrer` is empty when the page was opened via direct URL,
 *   PWA shortcut or push notification → use fallback.
 * - Cross-origin referrer → use fallback.
 * - Referrer matches an auth path → use fallback (logged-in users should
 *   never land on /login when pressing back).
 * - Otherwise → `router.back()`.
 *
 * Used by the in-app "Retour" button in `ConversationList`.
 */
export function smartBack(router: Router, fallbackHref: string): void {
  if (typeof window === 'undefined') return;
  const referrer = document.referrer;
  if (!referrer || isAuthPath(referrer)) {
    router.replace(fallbackHref);
    return;
  }
  router.back();
}
