/**
 * Inline snippet for the document head; must run before GTM / gtag.js.
 * Google Consent Mode v2 defaults (denied until banner grants).
 */
export const GOOGLE_CONSENT_MODE_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
});
`.trim();
