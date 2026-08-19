/**
 * Single source of truth for "bring the user back where they were" after
 * authentication (login, registration, OTP, OAuth, passkey, One Tap).
 *
 * Threat model — OWASP "Unvalidated Redirects and Forwards": the stored value
 * ends up in `router.replace()`, so it must never be able to point off-site.
 * We therefore use an allow-list approach: the only accepted shape is a
 * site-relative path (`/foo?bar=1#baz`). Absolute URLs are rejected outright
 * rather than host-checked — this flow never legitimately leaves the origin,
 * so there is nothing to allow. External redirects (payment gateways, Filament
 * SSO) keep going through `redirectToTrustedUrl`, which is a different concern.
 *
 * Context isolation: the owner (bailleur) and client (visiteur) spaces have
 * separate storage keys AND separate path prefixes. A value captured in one
 * space is never honoured in the other, so a stale key cannot bounce an owner
 * into the client app or vice versa.
 */

export type ReturnToContext = 'owner' | 'client';

const RETURN_TO_KEYS: Record<ReturnToContext, string> = {
  client: 'kh_redirect_after_login',
  owner: 'kh_owner_redirect',
};

/** Query-string parameter used when the destination travels through a URL. */
export const RETURN_TO_PARAM = 'redirect';

const DEFAULT_DESTINATION: Record<ReturnToContext, string> = {
  client: '/home',
  owner: '/owner/dashboard',
};

/**
 * Paths that must never be a post-auth destination: landing back on them
 * either re-triggers the auth flow (infinite loop) or is simply pointless.
 */
const NON_DESTINATION_PREFIXES = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/sso-callback',
  '/auth/callback',
  '/link-account-callback',
  '/choose-organization',
  '/owner/login',
  '/owner/register',
  '/owner/auth',
] as const;

function isNonDestination(path: string): boolean {
  return NON_DESTINATION_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

/**
 * Validates and normalises a candidate destination.
 *
 * @returns the safe path (with query + hash preserved), or `null` when the
 *   input is anything other than a plain site-relative path.
 */
export function sanitizeReturnToPath(
  raw: string | null | undefined
): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const candidate = raw.trim();

  if (candidate === '' || !candidate.startsWith('/')) {
    return null;
  }

  // `//evil.com` and `/\evil.com` are parsed as protocol-relative absolute
  // URLs by browsers — the classic open-redirect bypass of a `startsWith('/')`
  // check. Backslashes are normalised to slashes by several parsers, so both
  // spellings have to go.
  if (/^\/[/\\]/.test(candidate)) {
    return null;
  }

  // Control characters (NUL, CR, LF, TAB…) can smuggle parser confusion.

  if (/[\u0000-\u001F\u007F]/.test(candidate)) {
    return null;
  }

  // Normalise through the URL parser against an opaque base, then assert the
  // origin never moved. This also collapses `/a/../../b` traversal attempts.
  let parsed: URL;
  try {
    parsed = new URL(candidate, 'https://return-to.invalid');
  } catch {
    return null;
  }

  if (parsed.origin !== 'https://return-to.invalid') {
    return null;
  }

  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;

  if (isNonDestination(parsed.pathname)) {
    return null;
  }

  return normalized;
}

/**
 * Enforces space isolation: an owner destination lives under `/owner`, a client
 * destination never does.
 */
function matchesContext(path: string, context: ReturnToContext): boolean {
  const isOwnerPath = path === '/owner' || path.startsWith('/owner/');

  return context === 'owner' ? isOwnerPath : !isOwnerPath;
}

/**
 * Records where the user was headed, before sending them to an auth page.
 * Silently ignores unsafe or out-of-context values.
 *
 * @param path defaults to the current location (path + query + hash).
 */
export function captureReturnTo(context: ReturnToContext, path?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const candidate =
    path ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const safePath = sanitizeReturnToPath(candidate);

  if (safePath === null || !matchesContext(safePath, context)) {
    return;
  }

  try {
    sessionStorage.setItem(RETURN_TO_KEYS[context], safePath);
  } catch {
    // Private-mode / quota failures must never block the auth redirect.
  }
}

/** The landing page used when no destination was captured. */
export function defaultDestination(context: ReturnToContext): string {
  return DEFAULT_DESTINATION[context];
}

/** Reads the stored destination without consuming it. */
export function peekReturnTo(context: ReturnToContext): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(RETURN_TO_KEYS[context]);
  } catch {
    return null;
  }

  const safePath = sanitizeReturnToPath(stored);

  if (safePath === null || !matchesContext(safePath, context)) {
    return null;
  }

  return safePath;
}

/** Removes the stored destination for a context (both, when omitted). */
export function clearReturnTo(context?: ReturnToContext): void {
  if (typeof window === 'undefined') {
    return;
  }

  const contexts: ReturnToContext[] = context ? [context] : ['owner', 'client'];

  try {
    for (const ctx of contexts) {
      sessionStorage.removeItem(RETURN_TO_KEYS[ctx]);
    }
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Reads, validates and clears the stored destination.
 *
 * Both context keys are cleared on every call: a successful auth ends the
 * pending navigation for the whole tab, and leaving the other key behind is
 * what previously let an owner be redirected to a client URL.
 *
 * @returns the safe destination, or the context's default landing page.
 */
export function consumeReturnTo(context: ReturnToContext): string {
  const destination = peekReturnTo(context);
  clearReturnTo();

  return destination ?? DEFAULT_DESTINATION[context];
}

/**
 * Builds the auth URL to send an anonymous visitor to, carrying the intended
 * destination in the query string.
 *
 * The value is also written to sessionStorage, because third-party auth
 * (Clerk OAuth, One Tap) navigates away from our origin and comes back on a
 * callback route that no longer has our query string.
 */
export function buildAuthUrlWithReturnTo(
  authPath: string,
  context: ReturnToContext,
  path?: string
): string {
  captureReturnTo(context, path);

  const destination = peekReturnTo(context);

  if (destination === null) {
    return authPath;
  }

  const separator = authPath.includes('?') ? '&' : '?';

  return `${authPath}${separator}${RETURN_TO_PARAM}=${encodeURIComponent(destination)}`;
}

/**
 * Restores a destination handed over through the URL (`?redirect=…`) into
 * sessionStorage, so the rest of the flow (OTP, OAuth round-trip) can pick it
 * up. Safe to call on every render of an auth page.
 */
export function adoptReturnToFromQuery(
  context: ReturnToContext,
  rawValue: string | null | undefined
): void {
  if (!rawValue) {
    return;
  }

  captureReturnTo(context, rawValue);
}
