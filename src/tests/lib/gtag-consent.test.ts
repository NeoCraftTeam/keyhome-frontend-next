import { describe, expect, it } from 'vitest';
import { hasAnalyticsConsent } from '@/lib/analytics/gtag-consent';
import {
  DEFAULT_COOKIE_CONSENT,
  type CookieConsentPreferences,
} from '@/lib/cookie-consent-storage';

describe('hasAnalyticsConsent', () => {
  it('rejects null', () => {
    expect(hasAnalyticsConsent(null)).toBe(false);
  });

  it('rejects default prefs', () => {
    expect(hasAnalyticsConsent(DEFAULT_COOKIE_CONSENT)).toBe(false);
  });

  it('accepts analytics=true', () => {
    const prefs: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: false,
    };
    expect(hasAnalyticsConsent(prefs)).toBe(true);
  });
});
