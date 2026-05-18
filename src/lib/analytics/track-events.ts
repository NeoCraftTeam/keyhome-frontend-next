/**
 * Centralised marketing event helpers.
 *
 * Push semantic events to window.dataLayer so GTM can route them to any
 * downstream tag (Meta Pixel, TikTok, Twitter/X, Snapchat, GA4, etc.)
 * without further code changes.
 *
 * ## GTM setup (no code needed there)
 * Create one Custom Event trigger per event name below, then attach the
 * corresponding tag (Meta → fbq, TikTok → ttq, Twitter → twq, GA4 event).
 * GTM Consent Mode will automatically block tags when the visitor has not
 * granted ad_storage / ad_user_data.
 *
 * Event naming convention: `kh_<action>` (snake_case, never PascalCase).
 */

type Currency = 'XAF' | 'EUR' | 'USD';

function push(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}

// ── Authentication ─────────────────────────────────────────────────────────

/** User completed registration (OTP confirmed or OAuth finalised). */
export function trackSignUp(
  method: 'email' | 'google' | 'facebook' | 'github'
) {
  push('kh_sign_up', { auth_method: method });
}

/** User signed in to an existing account. */
export function trackLogin(method: 'email' | 'google' | 'facebook' | 'github') {
  push('kh_login', { auth_method: method });
}

// ── Ad browsing ────────────────────────────────────────────────────────────

/** User opened the detail page / modal of a listing. */
export function trackViewAd(
  adId: string,
  price: number,
  currency: Currency = 'XAF'
) {
  push('kh_view_ad', { content_id: adId, value: price, currency });
}

// ── Payments / conversion ──────────────────────────────────────────────────

/** User clicked "Débloquer" and the payment flow opened. */
export function trackInitiatePayment(
  adId: string,
  price: number,
  currency: Currency = 'XAF'
) {
  push('kh_initiate_payment', { content_id: adId, value: price, currency });
}

/** Payment confirmed — primary conversion event. */
export function trackUnlockAd(
  adId: string,
  price: number,
  currency: Currency = 'XAF',
  txRef?: string
) {
  push('kh_unlock_ad', {
    content_id: adId,
    value: price,
    currency,
    transaction_id: txRef,
  });
}

// ── Engagement ─────────────────────────────────────────────────────────────

/** User created a search alert. */
export function trackSearchAlertCreated() {
  push('kh_search_alert_created');
}

/** User opened a 360° / 3D virtual tour. */
export function trackOpen3dTour(adId: string) {
  push('kh_open_3d_tour', { content_id: adId });
}

/** User submitted a contact / viewing request. */
export function trackContactOwner(adId: string) {
  push('kh_contact_owner', { content_id: adId });
}

/** User subscribed to a premium plan. */
export function trackSubscribe(
  planId: string,
  price: number,
  currency: Currency = 'XAF'
) {
  push('kh_subscribe', { plan_id: planId, value: price, currency });
}
