'use client';

import { useEffect, useState } from 'react';
import { useTurnstileSiteKey } from './useTurnstileSiteKey';

/**
 * SSR-safe Turnstile gate for email/password submit buttons.
 *
 * Turnstile config resolves in useEffect (hostname, remote fetch), so the first
 * client render can disagree with SSR on `disabled`. Until hydration completes,
 * we treat the form as ready so server HTML matches the initial client tree.
 */
export function useTurnstileEmailSubmitReady(turnstileToken: string | null): {
  siteKey: string | null;
  turnstileEnabled: boolean;
  turnstileConfigResolved: boolean;
  emailPasswordReady: boolean;
} {
  const { siteKey, isResolved: turnstileConfigResolved } =
    useTurnstileSiteKey();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const turnstileEnabled = Boolean(siteKey);
  const turnstileSubmitReady =
    turnstileConfigResolved && (!turnstileEnabled || Boolean(turnstileToken));
  const emailPasswordReady = !hydrated || turnstileSubmitReady;

  return {
    siteKey,
    turnstileEnabled,
    turnstileConfigResolved,
    emailPasswordReady,
  };
}
