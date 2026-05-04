import { isAxiosError, type AxiosError } from 'axios';

export type LaravelValidationErrors = Record<string, string[] | string>;

type LaravelErrorBody = {
  message?: string;
  errors?: LaravelValidationErrors;
  debug?: { message?: string; exception?: string };
};

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
  const raw = err.response?.data;

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallback;
  }

  const d = raw as LaravelErrorBody;
  const segments: string[] = [];

  if (typeof d.message === 'string' && d.message.trim()) {
    segments.push(d.message.trim());
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
  if (dbg && !segments.some((s) => s === dbg || s.includes(dbg))) {
    segments.push(dbg);
  }

  return segments.length > 0 ? segments.join(' · ') : fallback;
}
