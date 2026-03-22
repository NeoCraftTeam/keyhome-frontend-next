import { getAuthToken } from '@/lib/auth-token';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Base URL without /api/v1 — used for /sanctum/csrf-cookie */
const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

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
  return document.cookie.split(';').some((c) => c.trim().startsWith('XSRF-TOKEN='));
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
    .catch(() => {
      // Silently fail — Bearer token auth may still work
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
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error),
);

export default api;
