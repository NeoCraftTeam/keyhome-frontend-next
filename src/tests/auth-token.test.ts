import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * We test auth-token by importing the module fresh for each test,
 * because it relies on module-level mutable state (tokenGetter).
 */

// Reset the module-level state by re-importing before each test
let registerTokenGetter: typeof import('@/lib/auth/auth-token').registerTokenGetter;
let getAuthToken: typeof import('@/lib/auth/auth-token').getAuthToken;

beforeEach(async () => {
  // Reset the module so tokenGetter starts as null each time
  vi.resetModules();
  const mod = await import('@/lib/auth/auth-token');
  registerTokenGetter = mod.registerTokenGetter;
  getAuthToken = mod.getAuthToken;
});

describe('auth-token', () => {
  describe('getAuthToken', () => {
    // BUG CATCH: If getAuthToken doesn't guard against no registered getter,
    // it would throw a "not a function" error crashing every API request.
    it('returns null when no getter has been registered', async () => {
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    // BUG CATCH: Token must actually flow through from Clerk's getToken
    // to the Axios interceptor, or every authenticated request fails silently.
    it('returns the token from the registered getter', async () => {
      const mockGetter = vi.fn().mockResolvedValue('jwt-test-token-abc123');
      registerTokenGetter(mockGetter);

      const token = await getAuthToken();
      expect(token).toBe('jwt-test-token-abc123');
      expect(mockGetter).toHaveBeenCalledOnce();
    });

    // BUG CATCH: Clerk's getToken returns null for unauthenticated users.
    // The interceptor must handle this gracefully (no Authorization header).
    it('returns null when the getter itself returns null', async () => {
      registerTokenGetter(vi.fn().mockResolvedValue(null));
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    // BUG CATCH: If Clerk session expires or network blips, getToken() throws.
    // Without this catch, every subsequent API call would crash instead of
    // falling back to an unauthenticated request.
    it('returns null when the getter throws an error', async () => {
      registerTokenGetter(
        vi.fn().mockRejectedValue(new Error('Clerk session expired'))
      );
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    // BUG CATCH: If the getter throws a non-Error (e.g. a string),
    // the catch block must still handle it gracefully.
    it('returns null when the getter throws a non-Error value', async () => {
      registerTokenGetter(vi.fn().mockRejectedValue('network timeout'));
      const token = await getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('registerTokenGetter', () => {
    // BUG CATCH: If registering a new getter doesn't overwrite the old one,
    // Clerk re-mounts after navigation would use a stale token getter.
    it('overwrites a previously registered getter', async () => {
      registerTokenGetter(vi.fn().mockResolvedValue('old-token'));
      registerTokenGetter(vi.fn().mockResolvedValue('new-token'));

      const token = await getAuthToken();
      expect(token).toBe('new-token');
    });

    // BUG CATCH: Calling getAuthToken multiple times should call the getter
    // each time (fresh token), not cache the first result.
    it('getter is called on every getAuthToken invocation (no caching)', async () => {
      let callCount = 0;
      registerTokenGetter(
        vi.fn(async () => {
          callCount++;
          return `token-${callCount}`;
        })
      );

      const first = await getAuthToken();
      const second = await getAuthToken();
      expect(first).toBe('token-1');
      expect(second).toBe('token-2');
    });
  });
});
