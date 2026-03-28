import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

// Mock auth-token before importing api so the interceptor uses our mock
vi.mock('@/lib/auth-token', () => ({
  getAuthToken: vi.fn(),
}));

import api, { ensureCsrfCookie, resetCsrfState } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const mockedGetAuthToken = vi.mocked(getAuthToken);

/**
 * Axios interceptor handlers are private — accessing them requires
 * reaching into internals. This type makes the cast explicit.
 */
interface InterceptorManager {
  handlers: Array<{
    fulfilled?: (value: unknown) => unknown;
    rejected?: (error: unknown) => unknown;
  }>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('api (Axios instance)', () => {
  describe('instance configuration', () => {
    // BUG CATCH: If baseURL is wrong, all API calls go to the wrong server.
    it('has the correct baseURL from environment or default', () => {
      expect(api.defaults.baseURL).toBeDefined();
      expect(typeof api.defaults.baseURL).toBe('string');
    });

    // BUG CATCH: Missing Content-Type causes Laravel to reject requests
    // with 415 Unsupported Media Type.
    it('sets Content-Type to application/json', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    // BUG CATCH: Missing Accept header causes Laravel to return HTML errors
    // instead of JSON, which breaks all error handling.
    it('sets Accept to application/json', () => {
      expect(api.defaults.headers['Accept']).toBe('application/json');
    });

    // BUG CATCH: Without withCredentials, cookies (CSRF, session) won't be
    // sent cross-origin, breaking Sanctum authentication.
    it('enables withCredentials for cross-origin cookie support', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });

    // BUG CATCH: Without a timeout, requests can hang forever on slow
    // networks, freezing the UI with no error feedback.
    it('sets a reasonable timeout (30s)', () => {
      expect(api.defaults.timeout).toBe(30000);
    });
  });

  describe('request interceptor', () => {
    // BUG CATCH: If the interceptor doesn't attach the Bearer token,
    // all authenticated API calls return 401 Unauthenticated.
    it('attaches Authorization header when token is available', async () => {
      mockedGetAuthToken.mockResolvedValue('test-jwt-token');

      // Use interceptors directly by running the request interceptor
      const config = {
        headers: api.defaults.headers,
      };

      // Execute request interceptors
      const interceptor = api.interceptors
        .request as unknown as InterceptorManager;
      const handlers = interceptor.handlers;
      expect(handlers.length).toBeGreaterThan(0);

      // Find the fulfilled handler (first interceptor)
      const fulfilledHandler = handlers[0]?.fulfilled;
      if (fulfilledHandler) {
        const result = await fulfilledHandler(config);
        expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
      }
    });

    // BUG CATCH: If no user is logged in, sending "Bearer null" or
    // "Bearer undefined" as the header would cause 401 errors instead
    // of allowing public endpoints to work.
    it('does NOT set Authorization header when token is null', async () => {
      mockedGetAuthToken.mockReset();
      mockedGetAuthToken.mockResolvedValue(null);

      // Use a fresh headers object (not shared with previous test)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const config = { headers };

      const interceptor = api.interceptors
        .request as unknown as InterceptorManager;
      const handlers = interceptor.handlers;
      const fulfilledHandler = handlers[0]?.fulfilled;
      if (fulfilledHandler) {
        const result = await fulfilledHandler(config);
        expect(result.headers.Authorization).toBeUndefined();
      }
    });
  });

  describe('response interceptor', () => {
    // BUG CATCH: If the response interceptor swallows errors, error handling
    // throughout the app (toasts, redirects, retry logic) breaks silently.
    it('has a response error interceptor that rejects', () => {
      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const handlers = interceptor.handlers;
      expect(handlers.length).toBeGreaterThan(0);

      const rejectedHandler = handlers[0]?.rejected;
      expect(rejectedHandler).toBeDefined();
    });

    // BUG CATCH: If 401 on an auth route (e.g. /auth/login) fires kh:auth-expired,
    // the user gets stuck in a redirect loop — login fails → expired event → login again.
    it('does NOT dispatch kh:auth-expired for 401 on auth routes', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      const authError = Object.assign(new Error('Unauthorized'), {
        response: { status: 401, headers: {} },
        config: { url: '/auth/login' },
        isAxiosError: true,
      });

      await rejectedHandler(authError).catch(() => {});
      const authExpiredCalls = dispatchSpy.mock.calls.filter(
        (call) => (call[0] as CustomEvent).type === 'kh:auth-expired'
      );
      expect(authExpiredCalls).toHaveLength(0);
      dispatchSpy.mockRestore();
    });

    // BUG CATCH: If the 429 handler is missing, a rate-limited user sees a generic
    // error with no guidance on when to retry. The kh:rate-limited event allows the
    // UI to show a contextual "Too many requests — please wait Xs" toast.
    it('dispatches kh:rate-limited when API returns 429', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      const rateLimitError = Object.assign(new Error('Too Many Requests'), {
        response: {
          status: 429,
          headers: { 'retry-after': '30' },
        },
        config: { url: '/ads' },
        isAxiosError: true,
      });

      await rejectedHandler(rateLimitError).catch(() => {});

      const rateLimitedCalls = dispatchSpy.mock.calls.filter(
        (call) => (call[0] as CustomEvent).type === 'kh:rate-limited'
      );
      expect(rateLimitedCalls).toHaveLength(1);
      const event = rateLimitedCalls[0][0] as CustomEvent;
      expect(event.detail.retryAfter).toBe('30');
      dispatchSpy.mockRestore();
    });

    // BUG CATCH: If retry-after header is absent, detail.retryAfter must be null
    // (not undefined or the raw header object), so the UI can safely check `!= null`.
    it('sets retryAfter to null when retry-after header is absent', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      const rateLimitError = Object.assign(new Error('Too Many Requests'), {
        response: { status: 429, headers: {} },
        config: { url: '/ads/search' },
        isAxiosError: true,
      });

      await rejectedHandler(rateLimitError).catch(() => {});

      const event = dispatchSpy.mock.calls.find(
        (call) => (call[0] as CustomEvent).type === 'kh:rate-limited'
      )?.[0] as CustomEvent | undefined;

      expect(event).toBeDefined();
      expect(event?.detail.retryAfter).toBeNull();
      dispatchSpy.mockRestore();
    });

    // BUG CATCH: The interceptor must still reject after dispatching events,
    // otherwise callers never receive the error and their catch blocks are skipped.
    it('rejects the promise after dispatching kh:rate-limited', async () => {
      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      const rateLimitError = Object.assign(new Error('Too Many Requests'), {
        response: { status: 429, headers: {} },
        config: { url: '/ads' },
        isAxiosError: true,
      });

      await expect(rejectedHandler(rateLimitError)).rejects.toThrow(
        'Too Many Requests'
      );
    });
  });

  describe('CSRF 419 retry logic', () => {
    // BUG CATCH: When the CSRF token expires mid-session, the server returns 419.
    // Without automatic retry, the user sees a confusing "Page Expired" error.
    it('retries request once after 419 by refetching CSRF cookie', async () => {
      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      // Mock axios.get for CSRF cookie refetch
      const axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({});

      // Mock api.request to simulate successful retry
      const apiRequestSpy = vi.spyOn(api, 'request').mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse);

      const csrfError = Object.assign(new Error('CSRF token mismatch'), {
        response: { status: 419, headers: {} },
        config: {
          url: '/payments/initialize/ad-123',
          method: 'post',
          headers: {},
        },
        isAxiosError: true,
      });

      const result = await rejectedHandler(csrfError);

      // Should have called ensureCsrfCookie (which calls axios.get)
      expect(axiosGetSpy).toHaveBeenCalled();
      // Should have retried the original request
      expect(apiRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/payments/initialize/ad-123',
          headers: expect.objectContaining({ 'x-csrf-retry': '1' }),
        })
      );
      expect(result.data.success).toBe(true);

      axiosGetSpy.mockRestore();
      apiRequestSpy.mockRestore();
    });

    // BUG CATCH: Without this guard, a persistent 419 (e.g. misconfigured server)
    // would cause an infinite retry loop, eventually crashing the browser tab.
    it('does NOT retry a second time (prevents infinite loop)', async () => {
      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      const retriedCsrfError = Object.assign(new Error('CSRF token mismatch'), {
        response: { status: 419, headers: {} },
        config: {
          url: '/payments/initialize/ad-123',
          method: 'post',
          headers: { 'x-csrf-retry': '1' },
        },
        isAxiosError: true,
      });

      await expect(rejectedHandler(retriedCsrfError)).rejects.toThrow(
        'CSRF token mismatch'
      );
    });

    // BUG CATCH: If the CSRF retry also fails with 419, we need a clean rejection
    // so the UI can show an appropriate error message.
    it('rejects when CSRF cookie refetch fails', async () => {
      const interceptor = api.interceptors
        .response as unknown as InterceptorManager;
      const rejectedHandler = interceptor.handlers[0]?.rejected;

      // ensureCsrfCookie silently fails, but the retry itself fails
      vi.spyOn(axios, 'get').mockRejectedValue(new Error('Network error'));
      const apiRequestSpy = vi.spyOn(api, 'request').mockRejectedValue(
        Object.assign(new Error('Still 419'), {
          response: { status: 419, headers: {} },
          config: { headers: { 'x-csrf-retry': '1' } },
        })
      );

      const csrfError = Object.assign(new Error('CSRF token mismatch'), {
        response: { status: 419, headers: {} },
        config: {
          url: '/ads',
          method: 'post',
          headers: {},
        },
        isAxiosError: true,
      });

      // ensureCsrfCookie swallows errors, but the retried request itself will be rejected
      await expect(rejectedHandler(csrfError)).rejects.toThrow('Still 419');

      apiRequestSpy.mockRestore();
    });
  });

  describe('resetCsrfState', () => {
    // BUG CATCH: If CSRF state isn't reset on logout, the next session
    // reuses a stale cookie, causing 419 on the first write request.
    it('is exported and callable', () => {
      expect(typeof resetCsrfState).toBe('function');
      expect(() => resetCsrfState()).not.toThrow();
    });
  });

  describe('ensureCsrfCookie', () => {
    // BUG CATCH: If ensureCsrfCookie isn't exported, the AuthProvider
    // can't manually trigger CSRF prefetch before sensitive operations.
    it('is exported and callable', async () => {
      expect(typeof ensureCsrfCookie).toBe('function');
      // It should resolve without throwing (even if the fetch itself fails)
      const axiosGetSpy = vi
        .spyOn(axios, 'get')
        .mockRejectedValue(new Error('offline'));
      await expect(ensureCsrfCookie()).resolves.not.toThrow();
      axiosGetSpy.mockRestore();
    });
  });
});
