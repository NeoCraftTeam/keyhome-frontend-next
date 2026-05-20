import { isAxiosError } from 'axios';

import { parseLaravelNestedApiErrorPayload } from '@/lib/api-errors';

/** Machine-readable auth error codes returned by the Laravel API. */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PANEL_ACCESS_DENIED: 'PANEL_ACCESS_DENIED',
  ROLE_CONTEXT_MISMATCH: 'ROLE_CONTEXT_MISMATCH',
  TOKEN_ROLE_MISMATCH: 'TOKEN_ROLE_MISMATCH',
  USER_ROLE_MISMATCH: 'USER_ROLE_MISMATCH',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_LOGIN_FAILURE_MESSAGE = 'Identifiants incorrects ';

export const AUTH_PANEL_UNAVAILABLE_MESSAGE =
  "Cette interface n'est pas disponible pour ce compte.";

export const AUTH_TOKEN_CONTEXT_MESSAGE =
  'Session non autorisée pour cette interface.';

const AUTH_CODE_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: AUTH_LOGIN_FAILURE_MESSAGE,
  [AUTH_ERROR_CODES.PANEL_ACCESS_DENIED]: AUTH_PANEL_UNAVAILABLE_MESSAGE,
  [AUTH_ERROR_CODES.ROLE_CONTEXT_MISMATCH]: AUTH_LOGIN_FAILURE_MESSAGE,
  [AUTH_ERROR_CODES.TOKEN_ROLE_MISMATCH]: AUTH_TOKEN_CONTEXT_MESSAGE,
  [AUTH_ERROR_CODES.USER_ROLE_MISMATCH]: AUTH_PANEL_UNAVAILABLE_MESSAGE,
};

/** Legacy / client-side strings that must never be shown (role enumeration). */
const LEAKY_AUTH_MESSAGE_PATTERNS: RegExp[] = [
  /panneau administrateur/i,
  /panneau propriétaire/i,
  /panneau bailleur/i,
  /accès réservé aux clients/i,
  /accès réservé aux propriétaires/i,
  /réservé aux bailleurs/i,
  /compte admin/i,
  /utilisateur admin/i,
  /rôle utilisateur/i,
];

export function isLeakyAuthMessage(msg: string): boolean {
  return LEAKY_AUTH_MESSAGE_PATTERNS.some((re) => re.test(msg));
}

export function messageForAuthErrorCode(
  code: string | null | undefined,
  context: 'login' | 'panel' = 'login'
): string {
  if (code && code in AUTH_CODE_MESSAGES) {
    const mapped = AUTH_CODE_MESSAGES[code as AuthErrorCode];
    if (context === 'login' && code === AUTH_ERROR_CODES.PANEL_ACCESS_DENIED) {
      return AUTH_LOGIN_FAILURE_MESSAGE;
    }

    return mapped;
  }

  return context === 'login'
    ? AUTH_LOGIN_FAILURE_MESSAGE
    : AUTH_PANEL_UNAVAILABLE_MESSAGE;
}

type LaravelAuthErrorBody = {
  message?: string;
  code?: string;
};

/** Reads top-level or nested `code` from a Laravel auth JSON body. */
export function extractAuthErrorCode(data: unknown): string | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const body = data as LaravelAuthErrorBody;
  if (typeof body.code === 'string' && body.code.trim()) {
    return body.code.trim();
  }

  const nested = parseLaravelNestedApiErrorPayload(data);

  return nested?.code && nested.code.length > 0 ? nested.code : null;
}

export function getAuthApiErrorCode(err: unknown): string | null {
  if (!isAxiosError(err)) {
    return null;
  }

  return extractAuthErrorCode(err.response?.data);
}

/**
 * User-safe French copy for login / OAuth / passkey flows.
 * Never surfaces backend messages that reveal role or panel.
 */
export function getAuthApiErrorMessage(
  err: unknown,
  context: 'login' | 'panel' = 'login',
  fallback?: string
): string {
  const defaultFallback =
    context === 'login'
      ? AUTH_LOGIN_FAILURE_MESSAGE
      : AUTH_PANEL_UNAVAILABLE_MESSAGE;

  const fb = fallback ?? defaultFallback;

  const code = getAuthApiErrorCode(err);
  if (code) {
    return messageForAuthErrorCode(code, context);
  }

  if (isAxiosError(err) && err.response) {
    const status = err.response.status;
    if (status === 401 || status === 403) {
      return fb;
    }
  }

  if (err instanceof Error && err.message && !isLeakyAuthMessage(err.message)) {
    return err.message;
  }

  return fb;
}
