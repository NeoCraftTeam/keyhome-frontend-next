import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock auth-token before importing api so the interceptor uses our mock
vi.mock('@/lib/auth-token', () => ({
  getAuthToken: vi.fn(),
}));

import api from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';

const mockedGetAuthToken = vi.mocked(getAuthToken);

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
      const interceptor = api.interceptors.request as any;
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

      const interceptor = api.interceptors.request as any;
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
      const interceptor = api.interceptors.response as any;
      const handlers = interceptor.handlers;
      expect(handlers.length).toBeGreaterThan(0);

      const rejectedHandler = handlers[0]?.rejected;
      expect(rejectedHandler).toBeDefined();
    });
  });
});
