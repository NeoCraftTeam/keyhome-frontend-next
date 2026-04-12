/**
 * Client-side UTM capture for Laravel acquisition attribution.
 * Persists standard UTM params from the URL into sessionStorage and exposes
 * a stable session_id for correlating {@code POST /track/visit} with registration.
 */

const SESSION_ID_KEY = 'kh_visit_session_id';
const VISIT_TRACKED_KEY = 'kh_track_visit_posted_v1';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type AttributionPayload = Partial<Record<UtmKey | 'session_id', string>>;

function generateUUID(): string {
  // crypto.randomUUID() requires a secure context (HTTPS or localhost).
  // Fall back to a Math.random-based RFC-4122 v4 UUID for plain HTTP dev hosts.
  if (
    typeof crypto !== 'undefined' &&
    typeof (crypto as Crypto & { randomUUID?: () => string }).randomUUID ===
      'function'
  ) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

/**
 * Merge UTM query params from the current URL into sessionStorage (last non-empty value wins).
 */
export function persistUtmFromCurrentUrl(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v && v.trim() !== '') {
      sessionStorage.setItem(`kh_${key}`, v.trim());
    }
  }
}

/**
 * Payload for {@code POST /api/v1/track/visit} and registration bodies.
 */
export function getAttributionBodyForApi(): AttributionPayload {
  if (typeof window === 'undefined') {
    return {};
  }
  const sessionId = getOrCreateSessionId();
  const out: AttributionPayload = {};
  if (sessionId) {
    out.session_id = sessionId;
  }
  for (const key of UTM_KEYS) {
    const v = sessionStorage.getItem(`kh_${key}`);
    if (v && v.trim() !== '') {
      out[key] = v.trim();
    }
  }
  return out;
}

export function hasPostedVisitThisBrowserSession(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return sessionStorage.getItem(VISIT_TRACKED_KEY) === '1';
}

export function markVisitPosted(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(VISIT_TRACKED_KEY, '1');
}

/**
 * Call after a successful account creation so stale UTMs are not reused.
 */
export function clearUtmParamsAfterRegistration(): void {
  if (typeof window === 'undefined') {
    return;
  }
  for (const key of UTM_KEYS) {
    sessionStorage.removeItem(`kh_${key}`);
  }
}
