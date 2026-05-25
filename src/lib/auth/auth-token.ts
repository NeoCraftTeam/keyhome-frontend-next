/**
 * Module-level Clerk token getter registration.
 *
 * Axios interceptors run outside React, so they cannot call hooks directly.
 * AuthProvider registers Clerk's `getToken` here once on mount;
 * the API interceptor calls `getAuthToken()` to obtain a fresh JWT on every request.
 */

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function registerTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
