/**
 * Shared cookie consent preferences (GDPR-style banner).
 * Used by {@link CookieBanner} and Google marketing / Consent Mode bridges.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'keyhome_cookie_consent_v1';

export const COOKIE_CONSENT_EVENT = 'kh:cookie-consent' as const;

export interface CookieConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function loadCookieConsentPreferences(): CookieConsentPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

    return raw ? (JSON.parse(raw) as CookieConsentPreferences) : null;
  } catch {
    return null;
  }
}

export function saveCookieConsentPreferences(
  prefs: CookieConsentPreferences
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_EVENT, { detail: prefs })
    );
  } catch {
    // localStorage may be full or disabled (private mode)
  }
}
