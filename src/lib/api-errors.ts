import { isAxiosError } from 'axios';

export type LaravelValidationErrors = Record<string, string[] | string>;

/** Laravel domain error shape: `{ code, message, hint }`. */
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
  code?: string;
  hint?: string;
};

/**
 * Normalizes a `{ code, message, hint }` triple into a domain payload.
 * Returns null when no user-facing message is present.
 */
function normalizeEnvelope(
  codeRaw: unknown,
  messageRaw: unknown,
  hintRaw: unknown
): LaravelNestedErrorPayload | null {
  const message = typeof messageRaw === 'string' ? messageRaw.trim() : '';
  if (!message) {
    return null;
  }

  const codeTrimmed = typeof codeRaw === 'string' ? codeRaw.trim() : '';
  const code = codeTrimmed.length > 0 ? codeTrimmed : undefined;
  const hintTrimmed = typeof hintRaw === 'string' ? hintRaw.trim() : '';
  const hint = hintTrimmed.length > 0 ? hintTrimmed : undefined;

  return { code, message, hint };
}

/**
 * Parses a Laravel domain error payload from a raw JSON body.
 *
 * Accepts both the legacy nested shape `{ error: { code, message, hint } }`
 * and the unified flat envelope `{ code, message, hint }`. The flat form is
 * only treated as a domain envelope when it carries a non-empty top-level
 * `code`, so generic `{ message }` / `{ message, errors }` bodies fall through
 * to the caller's own sanitization instead of being surfaced verbatim.
 */
export function parseLaravelNestedApiErrorPayload(
  raw: unknown
): LaravelNestedErrorPayload | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const body = raw as LaravelErrorBody;
  const nested = body.error;

  if (
    nested !== undefined &&
    typeof nested === 'object' &&
    nested !== null &&
    !Array.isArray(nested)
  ) {
    return normalizeEnvelope(nested.code, nested.message, nested.hint);
  }

  if (typeof body.code === 'string' && body.code.trim() !== '') {
    return normalizeEnvelope(body.code, body.message, body.hint);
  }

  return null;
}

/** Domain error payload from an Axios API error response. */
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
