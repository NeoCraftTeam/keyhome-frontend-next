/**
 * Inline script injected in <head> when GA4/GTM env is set.
 * Defaults all optional Google consents to denied until CookieBanner updates them.
 */
export const GOOGLE_CONSENT_MODE_DEFAULT_SCRIPT = [
  'window.dataLayer=window.dataLayer||[];',
  'function gtag(){dataLayer.push(arguments);}',
  "gtag('consent','default',{",
  "'ad_storage':'denied',",
  "'ad_user_data':'denied',",
  "'ad_personalization':'denied',",
  "'analytics_storage':'denied',",
  "'functionality_storage':'denied',",
  "'personalization_storage':'denied',",
  "'security_storage':'granted',",
  "'wait_for_update':500",
  '});',
].join('');
