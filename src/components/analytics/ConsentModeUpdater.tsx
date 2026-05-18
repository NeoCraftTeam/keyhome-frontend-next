'use client';

import { useEffect } from 'react';

const COOKIE_KEY = 'keyhome_cookie_consent_v1';

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

/**
 * Maps KeyHome cookie preferences to GTM Consent Mode V2 signals and calls
 * `gtag('consent','update',...)`. Must be mounted once in the root layout,
 * after GTM is loaded.
 *
 * - On mount: replays already-stored consent (returning visitors whose
 *   GTM bootstrap fired before localStorage was read).
 * - On `kh:cookie-consent` event: reacts to CookieBanner saves in real time.
 */
function applyConsent(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (typeof gtag !== 'function') return;
  gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    functionality_storage: prefs.analytics ? 'granted' : 'denied',
    personalization_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
  });
}

export function ConsentModeUpdater(): null {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOKIE_KEY);
      if (raw) applyConsent(JSON.parse(raw) as CookiePreferences);
    } catch {
      // localStorage unavailable
    }

    const handler = (e: Event) => {
      applyConsent((e as CustomEvent<CookiePreferences>).detail);
    };
    window.addEventListener('kh:cookie-consent', handler);
    return () => window.removeEventListener('kh:cookie-consent', handler);
  }, []);

  return null;
}
