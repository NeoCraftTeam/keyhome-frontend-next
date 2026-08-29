import { AxiosError } from 'axios';

import {
  extractAuthErrorCode,
  getAuthApiErrorMessage,
  isLeakyAuthMessage,
} from '@/lib/auth/auth-api-errors';
import { parseLaravelNestedApiErrorPayload } from '@/lib/api-errors';

const DEFAULT_ERROR = 'Une erreur est survenue. Veuillez réessayer.';

const NETWORK_TIMEOUT_FR =
  'Impossible de contacter le serveur. Vérifiez votre connexion internet et réessayez.';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide. Vérifiez les informations saisies et réessayez.',
  401: 'Vous devez être connecté pour effectuer cette action.',
  403: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  404: 'Ce service est temporairement indisponible. Veuillez réessayer plus tard.',
  408: 'Le serveur a mis trop de temps à répondre. Veuillez réessayer.',
  409: 'Cette action est en conflit avec une donnée existante.',
  413: 'Le fichier ou la requête est trop volumineux.',
  419: 'Votre session a expiré. Reconnectez-vous puis réessayez.',
  422: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  423: 'Cette ressource est temporairement verrouillée.',
  429: 'Trop de tentatives. Patientez quelques instants avant de réessayer.',
  500: "Une erreur inattendue s'est produite. Notre équipe a été notifiée.",
  502: 'Le serveur est momentanément injoignable. Réessayez dans un instant.',
  503: 'Le service est temporairement indisponible. Réessayez plus tard.',
  504: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
};

/**
 * Patterns that indicate a backend-internal message that must NEVER reach
 * the end user (security: avoid endpoint enumeration, stack traces, etc.).
 */
const UNSAFE_PATTERNS: RegExp[] = [
  /\bapi\/v\d/i,
  /\broute\b/i,
  /\bcontroller\b/i,
  /\bnamespace\b/i,
  /\bSQLSTATE\b/i,
  /\bclass\s+[A-Z][\w\\]+/,
  /\bcould not be found\b/i,
  /\bnot found\b/i,
  /\bundefined\s+(method|index|variable|property|offset)/i,
  /\bcall to (a member|undefined)/i,
  /\bnull on type\b/i,
  /\bTrace:/i,
  /\b(Exception|Error)\b.{0,60}\bin\s+\/?\w+/i,
  /https?:\/\/\S+/i,
  /\b(127\.0\.0\.1|localhost|0\.0\.0\.0)\b/i,
  /\.env\b/i,
  /\bphp\b/i,
  /\bLaravel\b/i,
  /\bMeilisearch\b/i,
  /\bPostgres(?:ql)?\b/i,
];

export function isUnsafeBackendMessage(msg: string): boolean {
  return UNSAFE_PATTERNS.some((re) => re.test(msg));
}

/**
 * Extract validation errors from a 422 response (Laravel format).
 * Returns the first field error (translated by the backend), or null.
 */
function getValidationErrors(
  error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>
): string | null {
  const data = error.response?.data;
  const errors = data?.errors;
  if (!errors)
    return data?.message && !isUnsafeBackendMessage(data.message)
      ? data.message
      : null;

  const messages = Object.values(errors)
    .flat()
    .filter(
      (m): m is string => typeof m === 'string' && !isUnsafeBackendMessage(m)
    );
  return messages.length > 0 ? messages.join(' ') : null;
}

function isAxiosNetworkOrTimeout(error: unknown): boolean {
  if (!(error instanceof AxiosError) || error.response) {
    return false;
  }
  const code = error.code;
  if (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ETIMEDOUT'
  ) {
    return true;
  }
  const msg = (error.message || '').toLowerCase();
  return msg.includes('timeout') || msg.includes('network error');
}

/**
 * Returns a user-safe French error message.
 *
 * Security policy: NEVER expose backend internals (route paths, stack traces,
 * server hostnames, env-var names, framework class names). Such messages are
 * filtered out and replaced with a status-coded fallback so a malicious user
 * cannot enumerate endpoints or fingerprint the stack.
 */
export function getSafeErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_ERROR,
  options?: { authContext?: 'login' | 'panel' }
): string {
  if (isAxiosNetworkOrTimeout(error)) {
    return NETWORK_TIMEOUT_FR;
  }

  if (!(error instanceof AxiosError) || !error.response) {
    if (error instanceof Error && error.message) {
      if (
        isLeakyAuthMessage(error.message) ||
        isUnsafeBackendMessage(error.message)
      ) {
        return options?.authContext
          ? getAuthApiErrorMessage(error, options.authContext, fallback)
          : fallback;
      }

      return error.message;
    }
    return fallback;
  }

  const status = error.response.status;
  const data = error.response.data as
    | { message?: string; errors?: Record<string, string[]>; code?: string }
    | undefined;

  if (options?.authContext && (status === 401 || status === 403)) {
    const authCode = extractAuthErrorCode(data);
    if (authCode || (data?.message && isLeakyAuthMessage(data.message))) {
      return getAuthApiErrorMessage(error, options.authContext, fallback);
    }
  }

  // Validation errors: surface field-level messages (already translated by backend).
  if (status === 422) {
    const validationMsg = getValidationErrors(
      error as AxiosError<{
        message?: string;
        errors?: Record<string, string[]>;
      }>
    );
    if (validationMsg) return validationMsg;
  }

  // Domain envelope (flat `{ code, message, hint }` or legacy `{ error: {...} }`),
  // e.g. HTTP 410 SLOT_NOT_AVAILABLE. Guarded against leaky-auth copy since a
  // top-level `code` now routes these bodies through the domain parser.
  const nested = parseLaravelNestedApiErrorPayload(data);
  if (
    nested &&
    nested.message &&
    !isUnsafeBackendMessage(nested.message) &&
    !isLeakyAuthMessage(nested.message)
  ) {
    const hintOk =
      nested.hint &&
      nested.hint !== nested.message &&
      !isUnsafeBackendMessage(nested.hint);

    return hintOk ? `${nested.message} · ${nested.hint}` : nested.message;
  }

  // Trust backend `message` only if it's already user-facing French copy.
  if (
    data?.message &&
    !isUnsafeBackendMessage(data.message) &&
    !isLeakyAuthMessage(data.message)
  ) {
    return data.message;
  }

  return STATUS_MESSAGES[status] ?? fallback;
}
