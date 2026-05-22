import { isAxiosError, type AxiosError } from 'axios';

export type LaravelValidationErrors = Record<string, string[] | string>;

/** Laravel JSON shape: `{ error: { code, message, hint } }` */
export type LaravelNestedErrorPayload = {
  code?: string;
  message: string;
  hint?: string;
};

type LaravelErrorBody = {
  message?: string;
  errors?: LaravelValidationErrors;
  debug?: { message?: string; exception?: string };
  error?: LaravelNestedErrorPayload | string;
};

/**
 * Parses `error` object from a Laravel JSON body (not Axios-specific).
 */
export function parseLaravelNestedApiErrorPayload(
  raw: unknown
): LaravelNestedErrorPayload | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const errUnknown = (raw as LaravelErrorBody).error;
  if (
    errUnknown === undefined ||
    typeof errUnknown !== 'object' ||
    errUnknown === null ||
    Array.isArray(errUnknown)
  ) {
    return null;
  }

  const msg =
    typeof errUnknown.message === 'string' ? errUnknown.message.trim() : '';
  if (!msg) {
    return null;
  }

  const code =
    typeof errUnknown.code === 'string' ? errUnknown.code.trim() : undefined;
  const hintRaw =
    typeof errUnknown.hint === 'string' ? errUnknown.hint.trim() : '';
  const hint = hintRaw.length > 0 ? hintRaw : undefined;

  return { code, message: msg, hint };
}

/** Nested `{ error: ... }` from an Axios API error response. */
export function getLaravelNestedApiError(
  err: unknown
): LaravelNestedErrorPayload | null {
  if (!isAxiosError(err)) {
    return null;
  }

  return parseLaravelNestedApiErrorPayload(err.response?.data);
}

export function getLaravelNestedApiErrorCode(err: unknown): string | null {
  const n = getLaravelNestedApiError(err);
  return n?.code && n.code.length > 0 ? n.code : null;
}

/** Laravel ModelNotFoundException text — never show to end users. */
const LARAVEL_INTERNAL_MESSAGE = /^No query results for model \[[^\]]+\]/i;

function isInternalLaravelApiMessage(message: string): boolean {
  return LARAVEL_INTERNAL_MESSAGE.test(message.trim());
}

function flattenLaravelErrors(errors: LaravelValidationErrors): string[] {
  const out: string[] = [];

  for (const v of Object.values(errors)) {
    if (Array.isArray(v)) {
      for (const s of v) {
        if (typeof s === 'string' && s.trim()) {
          out.push(s.trim());
        }
      }
    } else if (typeof v === 'string' && v.trim()) {
      out.push(v.trim());
    }
  }

  return out;
}

/**
 * Human-readable message from a Laravel API error payload (Axios) or generic Error.
 */
export function getLaravelApiErrorMessage(
  err: unknown,
  fallback: string
): string {
  if (isAxiosError(err)) {
    return getMessageFromAxiosError(err, fallback);
  }

  if (err instanceof Error && err.message.trim()) {
    const m = err.message.trim();
    if (!/^Request failed with status code \d+$/i.test(m)) {
      return m;
    }
  }

  return fallback;
}

function getMessageFromAxiosError(err: AxiosError, fallback: string): string {
  // Axios timeout (client-side)
  if (err.code === 'ECONNABORTED') {
    return "La requête a expiré. Vérifiez vos annonces — la publication peut avoir abouti malgré l'erreur.";
  }

  // No response received — includes CORS-stripped proxy errors (504, etc.)
  if (!err.response) {
    return 'Erreur de connexion au serveur. Vérifiez vos annonces — la publication peut avoir abouti malgré cette erreur. Vérifiez aussi votre connexion.';
  }

  // Explicit 504 from proxy (rare if CORS headers are set on the proxy)
  if (err.response.status === 504) {
    return 'Le serveur met trop de temps à répondre (504). Vérifiez vos annonces — la publication peut avoir réussi.';
  }

  const raw = err.response?.data;

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallback;
  }

  const d = raw as LaravelErrorBody;
  const segments: string[] = [];

  const nested = parseLaravelNestedApiErrorPayload(raw);
  if (nested) {
    segments.push(nested.message);
    if (
      nested.hint &&
      nested.hint !== nested.message &&
      !segments.includes(nested.hint)
    ) {
      segments.push(nested.hint);
    }
  }

  if (typeof d.message === 'string' && d.message.trim()) {
    const top = d.message.trim();
    if (!isInternalLaravelApiMessage(top) && !segments.includes(top)) {
      segments.push(top);
    }
  }

  if (d.errors && typeof d.errors === 'object') {
    for (const line of flattenLaravelErrors(d.errors)) {
      if (!segments.includes(line)) {
        segments.push(line);
      }
    }
  }

  if (segments.length === 0 && err.message.trim()) {
    const m = err.message.trim();
    if (!/^Request failed with status code \d+$/i.test(m)) {
      segments.push(m);
    }
  }

  const dbg =
    d.debug && typeof d.debug.message === 'string' && d.debug.message.trim()
      ? d.debug.message.trim()
      : '';
  if (
    dbg &&
    !isInternalLaravelApiMessage(dbg) &&
    !segments.some((s) => s === dbg || s.includes(dbg))
  ) {
    segments.push(dbg);
  }

  const joined = segments.length > 0 ? segments.join(' · ') : fallback;

  return isInternalLaravelApiMessage(joined) ? fallback : joined;
}
