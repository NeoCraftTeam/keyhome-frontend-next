import type { AttributionPayload } from '@/lib/utm';

/**
 * Pushes attribution fields for GTM / GA4 tag configuration (triggers on {@code kh_attribution}).
 */
export function pushAttributionToDataLayer(payload: AttributionPayload): void {
  if (typeof window === 'undefined') {
    return;
  }
  const hasUtm = Boolean(
    payload.utm_source ||
    payload.utm_medium ||
    payload.utm_campaign ||
    payload.utm_content ||
    payload.utm_term
  );
  if (!hasUtm && !payload.session_id) {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: 'kh_attribution',
    kh_session_id: payload.session_id ?? undefined,
    utm_source: payload.utm_source,
    utm_medium: payload.utm_medium,
    utm_campaign: payload.utm_campaign,
    utm_content: payload.utm_content,
    utm_term: payload.utm_term,
  });
}
