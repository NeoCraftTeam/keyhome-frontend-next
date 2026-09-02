'use client';

/**
 * use401Listener — listens for `kh:auth-expired` window events and clears
 * the session without requiring a page reload.
 *
 * Also handles `kh:bearer-stale`: the Axios interceptor raises it when a 401
 * came from a dead bearer while the cookie session is still alive. Only the
 * bearer of the current panel is dropped there — `user`, the React Query
 * cache and the role cookie all survive, so the page keeps rendering as
 * authenticated while requests fall back to the session cookie.
 *
 * Extracted from AuthProvider to keep the provider file focused on composition.
 */

import {
  clearAllInMemoryTokens,
  clearInMemoryToken,
  clearRoleCookie,
} from '@/lib/auth/auth-session';
import type { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function use401Listener(
  user: User | null,
  setToken: (t: string | null) => void,
  setUserState: (u: User | null) => void
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAuthExpired = () => {
      if (!user) return;
      // clearAllInMemoryTokens() internally calls registerTokenGetter(() => null)
      // AND removes sessionStorage backup keys so a page refresh cannot
      // rehydrate a stale token and silently re-authenticate the user.
      clearAllInMemoryTokens();
      queryClient.clear();
      setToken(null);
      setUserState(null);
      clearRoleCookie();
    };
    const handleBearerStale = () => {
      if (!user) return;
      clearInMemoryToken();
      setToken(null);
    };
    window.addEventListener('kh:auth-expired', handleAuthExpired);
    window.addEventListener('kh:bearer-stale', handleBearerStale);
    return () => {
      window.removeEventListener('kh:auth-expired', handleAuthExpired);
      window.removeEventListener('kh:bearer-stale', handleBearerStale);
    };
  }, [user, queryClient, setToken, setUserState]);
}
