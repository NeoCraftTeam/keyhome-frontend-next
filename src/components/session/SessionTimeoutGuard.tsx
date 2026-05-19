'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { UserRole } from '@/types';
import SessionTimeoutModal from './SessionTimeoutModal';
import { useCallback, useRef, useState } from 'react';

/** Idle duration before the warning modal appears (15 minutes). */
const IDLE_MS = 15 * 60 * 1000;

/** Countdown duration shown in the modal (60 seconds). */
const COUNTDOWN_MS = 60 * 1000;

const COUNTDOWN_SECONDS = Math.ceil(COUNTDOWN_MS / 1000);

/**
 * Monitors user activity and displays a session timeout warning.
 *
 * - After `IDLE_MS` of inactivity → shows the warning modal.
 * - "Prolonger la session" → calls `refreshSession()` (POST /auth/refresh) to
 *   rotate the Sanctum token, then resets the idle timer via `extendSession()`.
 * - "Se déconnecter" or countdown reaches 0 → calls `logout()`.
 * - If refresh fails → shows an error state for 2 s, then force-logs out.
 *
 * Render this once, inside AuthProvider (e.g. in `providers.tsx`).
 *
 * Implementation notes:
 * - `refreshSession()` from AuthContext handles both token rotation and
 *   React-state updates — this component has zero direct token knowledge.
 * - `/auth/refresh` is in AUTH_ROUTES (api.ts) so a 401 there does NOT fire
 *   the global `kh:auth-expired` event — the guard owns the error path.
 */
export default function SessionTimeoutGuard() {
  const { isAuthenticated, user, logout, refreshSession } = useAuth();
  const [refreshError, setRefreshError] = useState(false);
  const isRefreshingRef = useRef(false);

  const isOwner = user?.role === UserRole.AGENT;
  const logoutTarget = isOwner ? '/owner/login' : '/home';

  const handleTimeout = useCallback(() => {
    void logout(logoutTarget);
  }, [logout, logoutTarget]);

  const { showWarning, secondsLeft, extendSession } = useIdleTimeout({
    idleMs: IDLE_MS,
    countdownMs: COUNTDOWN_MS,
    onTimeout: handleTimeout,
    enabled: isAuthenticated,
  });

  const handleExtend = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshError(false);

    try {
      const success = await refreshSession();

      if (!success) {
        // Token is expired or server unreachable — tell the user briefly
        // then do a clean logout so they land on the correct login page.
        setRefreshError(true);
        await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        void logout(logoutTarget);
        return;
      }

      // Token successfully rotated — reset idle timer + broadcast to other tabs.
      extendSession();
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshSession, logout, logoutTarget, extendSession]);

  if (!isAuthenticated) return null;

  return (
    <SessionTimeoutModal
      open={showWarning}
      secondsLeft={secondsLeft}
      countdownTotal={COUNTDOWN_SECONDS}
      onExtend={handleExtend}
      onLogout={() => void logout(logoutTarget)}
      refreshError={refreshError}
      useOwnerAccent={isOwner}
    />
  );
}
