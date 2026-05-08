import type { CookieConsentPreferences } from '@/lib/cookie-consent-storage';

/**
 * Applies Google Consent Mode v2 update. Safe to call before gtag.js loads (queues on dataLayer).
 */
export function pushGtagConsentUpdate(prefs: CookieConsentPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag !== 'function') {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }
  window.gtag('consent', 'update', {
    analytics_storage: prefs.analytics ? 'granted' : 'denied',
    ad_storage: prefs.marketing ? 'granted' : 'denied',
    ad_user_data: prefs.marketing ? 'granted' : 'denied',
    ad_personalization: prefs.marketing ? 'granted' : 'denied',
  });
}

export function hasAnalyticsConsent(
  prefs: CookieConsentPreferences | null
): prefs is CookieConsentPreferences {
  return prefs !== null && prefs.analytics === true;
}
