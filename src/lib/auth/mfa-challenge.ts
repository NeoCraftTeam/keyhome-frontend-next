import { isAxiosError } from 'axios';

import {
  AUTH_PANEL_UNAVAILABLE_MESSAGE,
  extractAuthErrorCode,
} from '@/lib/auth/auth-api-errors';

/**
 * Second factor at login — client side of the `MFA_CHALLENGE_REQUIRED` protocol.
 *
 * A login whose owner enabled 2FA never receives a Sanctum token: the API
 * answers `403 { code: 'MFA_CHALLENGE_REQUIRED', mfa_token, … }` and the login
 * finishes at `POST /auth/mfa/challenge`. This module owns
 *
 *  - parsing that 403 body into a typed payload,
 *  - the French copy for every MFA error code (`getAuthApiErrorMessage` maps
 *    unknown codes to "Identifiants incorrects", which would be actively
 *    misleading in the middle of a second factor),
 *  - an **in-memory** store for the pending ticket.
 *
 * The ticket is deliberately kept out of `sessionStorage`/`localStorage`: it is
 * a pre-auth credential, so it must not survive a reload nor be readable by
 * another script. It only has to outlive a client-side navigation to
 * `/verify-2fa`, which a module-scoped variable does.
 */

export const MFA_CHALLENGE_REQUIRED = 'MFA_CHALLENGE_REQUIRED';

/** Methods the API can complete a challenge with. */
export type MfaMethod = 'totp' | 'email' | 'recovery';

/** Which login surface issued the challenge — decides the redirect afterwards. */
export type MfaLoginContext = 'client' | 'owner';

export interface MfaChallengePayload {
  mfaToken: string;
  /** Enrolled methods, most secure first (`totp` before `email`). */
  methods: MfaMethod[];
  hasRecoveryCodes: boolean;
  /** `j***@example.com` — never the full address. */
  maskedEmail: string;
  expiresInMinutes: number;
  attemptsRemaining: number;
}

export interface PendingMfaChallenge extends MfaChallengePayload {
  context: MfaLoginContext;
  /** `Date.now()` at issuance — expires the in-memory copy. */
  createdAt: number;
}

const KNOWN_METHODS: MfaMethod[] = ['totp', 'email', 'recovery'];

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Reads the 403 body every login surface returns when a second factor is due.
 * `code` is the discriminator: a 403 can also mean `email_verification_required`.
 */
export function parseMfaChallengePayload(
  data: unknown
): MfaChallengePayload | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const body = data as Record<string, unknown>;

  if (body.code !== MFA_CHALLENGE_REQUIRED) {
    return null;
  }

  const mfaToken =
    typeof body.mfa_token === 'string' ? body.mfa_token.trim() : '';

  if (!mfaToken) {
    return null;
  }

  const methods = Array.isArray(body.methods)
    ? body.methods.filter((method): method is MfaMethod =>
        KNOWN_METHODS.includes(method as MfaMethod)
      )
    : [];

  return {
    mfaToken,
    methods,
    hasRecoveryCodes: body.has_recovery_codes === true,
    maskedEmail: typeof body.masked_email === 'string' ? body.masked_email : '',
    expiresInMinutes: toPositiveInt(body.expires_in_minutes, 10),
    attemptsRemaining: toPositiveInt(body.attempts_remaining, 5),
  };
}

/** Non-null only for the `403 MFA_CHALLENGE_REQUIRED` answer. */
export function extractMfaChallenge(err: unknown): MfaChallengePayload | null {
  if (!isAxiosError(err) || err.response?.status !== 403) {
    return null;
  }

  return parseMfaChallengePayload(err.response.data);
}

// ── French copy ──────────────────────────────────────────────────────────────

export const MFA_GENERIC_ERROR_MESSAGE =
  'La vérification a échoué. Réessayez dans un instant.';

export const MFA_CHALLENGE_LOST_MESSAGE =
  'Session de vérification expirée. Reconnectez-vous pour recommencer.';

export const MFA_NETWORK_ERROR_MESSAGE =
  'Connexion au serveur impossible. Vérifiez votre réseau puis réessayez.';

/**
 * Copy per MFA error code — login challenge *and* enrolment.
 *
 * Kept generic on purpose: a message must never reveal whether the account
 * exists, which factors it carries, or how many recovery codes are left.
 */
const MFA_CODE_MESSAGES: Record<string, string> = {
  // Login challenge
  MFA_INVALID_CODE: 'Code incorrect. Vérifiez le code puis réessayez.',
  MFA_CHALLENGE_INVALID: MFA_CHALLENGE_LOST_MESSAGE,
  MFA_CHALLENGE_EXHAUSTED:
    'Trop de codes incorrects. Reconnectez-vous pour recommencer la vérification.',
  MFA_EMAIL_NOT_ENABLED:
    "La vérification par email n'est pas activée sur ce compte.",
  RATE_LIMITED: 'Trop de tentatives. Patientez un instant avant de réessayer.',
  PANEL_ACCESS_DENIED: AUTH_PANEL_UNAVAILABLE_MESSAGE,
  // Enrolment (settings)
  MFA_TOTP_ALREADY_ENABLED:
    "L'application d'authentification est déjà activée sur ce compte.",
  MFA_TOTP_NOT_ENABLED:
    "L'application d'authentification n'est pas activée sur ce compte.",
  MFA_TOTP_NO_PENDING_SETUP:
    'Configuration expirée. Relancez-la pour obtenir un nouveau QR code.',
  MFA_TOTP_INVALID_CODE:
    'Code incorrect. Vérifiez le code affiché dans votre application puis réessayez.',
  MFA_EMAIL_ALREADY_ENABLED:
    'La vérification par email est déjà activée sur ce compte.',
  MFA_EMAIL_INVALID_CODE:
    'Code incorrect. Vérifiez votre boîte mail puis réessayez.',
  MFA_NOT_CONFIGURED:
    "Aucune vérification en deux étapes n'est configurée sur ce compte.",
};

/** Safe French message for any MFA failure — backend strings are never echoed. */
export function mfaErrorMessage(
  err: unknown,
  fallback: string = MFA_GENERIC_ERROR_MESSAGE
): string {
  const code = isAxiosError(err)
    ? extractAuthErrorCode(err.response?.data)
    : null;

  if (code && code in MFA_CODE_MESSAGES) {
    return MFA_CODE_MESSAGES[code];
  }

  if (isAxiosError(err)) {
    if (!err.response) {
      return MFA_NETWORK_ERROR_MESSAGE;
    }

    if (err.response.status === 429) {
      return MFA_CODE_MESSAGES.RATE_LIMITED;
    }
  }

  return fallback;
}

/** Seconds to wait after a 429, from the body or the `Retry-After` header. */
export function mfaRetryAfterSeconds(err: unknown): number | null {
  if (!isAxiosError(err)) {
    return null;
  }

  const body = err.response?.data as { retry_after?: unknown } | undefined;
  const raw = body?.retry_after ?? err.response?.headers?.['retry-after'];
  const parsed = typeof raw === 'number' ? raw : Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : null;
}

/** Attempts the ticket still allows, as reported by the failed answer. */
export function mfaAttemptsRemaining(err: unknown): number | null {
  if (!isAxiosError(err)) {
    return null;
  }

  const body = err.response?.data as
    | { attempts_remaining?: unknown }
    | undefined;

  if (body?.attempts_remaining === undefined) {
    return null;
  }

  const parsed = Number(body.attempts_remaining);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

/** Codes that kill the ticket — retrying is pointless, the user must log in again. */
const TERMINAL_MFA_CODES = new Set([
  'MFA_CHALLENGE_INVALID',
  'MFA_CHALLENGE_EXHAUSTED',
  'PANEL_ACCESS_DENIED',
]);

export function isTerminalMfaError(err: unknown): boolean {
  const code = isAxiosError(err)
    ? extractAuthErrorCode(err.response?.data)
    : null;

  return code !== null && TERMINAL_MFA_CODES.has(code);
}

/** Where the second-factor page lives for each login surface. */
export function mfaChallengePathFor(context: MfaLoginContext): string {
  return context === 'owner' ? '/owner/auth/verify-2fa' : '/verify-2fa';
}

/** Where to send the user back when the ticket is gone. */
export function mfaLoginPathFor(context: MfaLoginContext): string {
  return context === 'owner' ? '/owner/login' : '/login';
}

// ── In-memory pending challenge ──────────────────────────────────────────────

let pendingChallenge: PendingMfaChallenge | null = null;

/** Small grace over the server TTL so the UI never expires *before* the API. */
const STORE_GRACE_MS = 30_000;

function isExpired(challenge: PendingMfaChallenge): boolean {
  const lifetimeMs = challenge.expiresInMinutes * 60_000 + STORE_GRACE_MS;

  return Date.now() - challenge.createdAt > lifetimeMs;
}

export function rememberMfaChallenge(
  payload: MfaChallengePayload,
  context: MfaLoginContext
): PendingMfaChallenge {
  pendingChallenge = { ...payload, context, createdAt: Date.now() };

  return pendingChallenge;
}

/** The pending ticket, or null when there is none / it has expired. */
export function peekMfaChallenge(): PendingMfaChallenge | null {
  if (pendingChallenge && isExpired(pendingChallenge)) {
    pendingChallenge = null;
  }

  return pendingChallenge;
}

/** Read and drop — called once the challenge has been completed. */
export function consumeMfaChallenge(): PendingMfaChallenge | null {
  const current = peekMfaChallenge();
  pendingChallenge = null;

  return current;
}

export function forgetMfaChallenge(): void {
  pendingChallenge = null;
}

/** Keep the displayed attempt counter in sync with the API's answer. */
export function updateMfaChallengeAttempts(
  attemptsRemaining: number
): PendingMfaChallenge | null {
  const current = peekMfaChallenge();

  if (!current) {
    return null;
  }

  pendingChallenge = {
    ...current,
    attemptsRemaining: Math.max(0, Math.floor(attemptsRemaining)),
  };

  return pendingChallenge;
}
