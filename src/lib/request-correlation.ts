/**
 * Browser session correlation for API diagnostics: ties multiple XHRs from the
 * same tab to one id, while each request still has a unique X-Request-ID.
 */

const SESSION_KEY = 'kh_api_correlation_id';

export function getOrCreateCorrelationId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && isValidCorrelationToken(existing)) {
      return existing;
    }
    const next = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

function isValidCorrelationToken(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
