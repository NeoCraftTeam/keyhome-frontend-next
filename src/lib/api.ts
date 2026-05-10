import { getAuthToken } from '@/lib/auth-token';
import { getEchoSocketId } from '@/lib/echo';
import { getOrCreateCorrelationId } from '@/lib/request-correlation';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Base URL without /api/v1 — used for /sanctum/csrf-cookie */
const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

/** Routes that should NOT trigger the 401 auth-expired event */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/clerk/',
  '/auth/me',
  '/auth/verify-email-otp',
  '/auth/resend-verification',
  '/auth/logout', // 401 here means session already expired; logout handles its own cleanup
  '/auth/webauthn/login', // Passkey login verify is unauthenticated
  '/auth/webauthn/login/options', // Passkey login options is unauthenticated
  '/auth/refresh', // Session timeout guard handles its own retry/error path
  '/broadcasting/auth', // WebSocket subscription auth — own retry path
  // Post-checkout verify endpoints. Returning from a cross-origin Flutterwave
  // redirect can briefly drop the session cookie (Safari/Firefox SameSite=Lax
  // on cross-domain XHR). A 401 here MUST NOT log the user out — the callback
  // page handles its own retry path and falls back to the public status route.
  '/credits/verify-purchase',
  '/payments/verify_payment',
  // Public, auth-less payment status (always 200) — listed for symmetry only.
  '/public-status',
];

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

/* ---------- CSRF cookie management for Sanctum SPA auth ---------- */

let csrfReady = false;
let csrfPromise: Promise<void> | null = null;

function hasXsrfCookie(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith('XSRF-TOKEN='));
}

/**
 * Ensure the XSRF-TOKEN cookie exists before write requests.
 * Calls GET /sanctum/csrf-cookie once; subsequent calls are no-ops.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (csrfReady || hasXsrfCookie()) {
    csrfReady = true;
    return;
  }
  if (csrfPromise) {
    return csrfPromise;
  }
  csrfPromise = axios
    .get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true })
    .then(() => {
      csrfReady = true;
    })
    .catch((e: unknown) => {
      console.warn('[KeyHome] CSRF cookie fetch failed:', e);
      // Don't re-throw — let the request proceed; the server will return 419
      // and the user will see a proper error via getSafeErrorMessage.
    })
    .finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}

/** Reset CSRF state (call on logout so the next session gets a fresh cookie) */
export function resetCsrfState(): void {
  csrfReady = false;
  csrfPromise = null;
}

/* ---------- Request interceptors ---------- */

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Attach the current Pusher socket id (synchronous read of the Echo singleton).
    // Laravel uses this header to power Broadcast::toOthers() — without it the
    // sender of a chat message also receives their own broadcast event, forcing
    // the frontend to dedup by uuid. Header is harmless when Echo is not connected.
    //
    // Defensive: never let a Pusher / Echo failure prevent an HTTP request from
    // going out. If reading the socket id throws for any reason (singleton not
    // initialised, pusher-js error, SSR edge case…) we silently skip the header.
    if (config.headers) {
      try {
        const socketId = getEchoSocketId();
        if (socketId) {
          config.headers['X-Socket-Id'] = socketId;
        }
      } catch {
        /* swallow — request must always proceed */
      }

      if (typeof window !== 'undefined') {
        if (
          !config.headers['X-Request-ID'] &&
          typeof crypto !== 'undefined' &&
          typeof crypto.randomUUID === 'function'
        ) {
          config.headers['X-Request-ID'] = crypto.randomUUID();
        }
        const correlationId = getOrCreateCorrelationId();
        if (correlationId) {
          config.headers['X-Correlation-ID'] = correlationId;
        }
      }
    }

    // Ensure CSRF cookie exists before any write request (SPA auth)
    if (
      typeof window !== 'undefined' &&
      config.method &&
      !['get', 'head', 'options'].includes(config.method.toLowerCase())
    ) {
      await ensureCsrfCookie();
    }

    // Don't overwrite an explicit Authorization header (e.g. Clerk JWT passed in config)
    if (config.headers?.Authorization) {
      return config;
    }
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/* ---------- Response interceptors ---------- */

/** Track 419 retry to prevent infinite loops */
const CSRF_RETRY_HEADER = 'x-csrf-retry';

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle CSRF token expiry: reset state, refetch cookie, and retry once
    if (
      error.response?.status === 419 &&
      error.config &&
      !error.config.headers?.[CSRF_RETRY_HEADER]
    ) {
      csrfReady = false;
      csrfPromise = null;
      await ensureCsrfCookie();
      error.config.headers = error.config.headers ?? {};
      error.config.headers[CSRF_RETRY_HEADER] = '1';
      return api.request(error.config);
    }

    if (typeof window !== 'undefined') {
      if (
        error.response?.status === 401 &&
        !AUTH_ROUTES.some((r) => error.config?.url?.includes(r))
      ) {
        window.dispatchEvent(new CustomEvent('kh:auth-expired'));
      }

      if (error.response?.status === 429) {
        window.dispatchEvent(
          new CustomEvent('kh:rate-limited', {
            detail: {
              retryAfter:
                (error.response.headers as Record<string, string | undefined>)[
                  'retry-after'
                ] ?? null,
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
