'use client';

/**
 * use401Listener — listens for `kh:auth-expired` window events and clears
 * the session without requiring a page reload.
 *
 * Extracted from AuthProvider to keep the provider file focused on composition.
 */

import { clearAllInMemoryTokens, clearRoleCookie } from '@/lib/auth-session';
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
    window.addEventListener('kh:auth-expired', handleAuthExpired);
    return () =>
      window.removeEventListener('kh:auth-expired', handleAuthExpired);
  }, [user, queryClient, setToken, setUserState]);
}
