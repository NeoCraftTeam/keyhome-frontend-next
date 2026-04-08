import { getAuthToken } from '@/lib/auth-token';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL =
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
