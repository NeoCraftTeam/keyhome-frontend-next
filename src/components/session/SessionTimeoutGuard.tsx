'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { authService } from '@/services/auth.service';
import { persistOwnerToken, persistClientToken } from '@/lib/auth-session';
import { UserRole } from '@/types';
import SessionTimeoutModal from './SessionTimeoutModal';
import { useCallback, useRef } from 'react';

/** Idle duration before the warning modal appears (15 minutes). */
const IDLE_MS = 15 * 60 * 1000;

/** Countdown duration shown in the modal (60 seconds). */
const COUNTDOWN_MS = 60 * 1000;

const COUNTDOWN_SECONDS = Math.ceil(COUNTDOWN_MS / 1000);

/**
 * Monitors user activity and displays a session timeout warning.
 *
 * - After `IDLE_MS` of inactivity → shows the warning modal.
 * - "Prolonger la session" → calls `POST /auth/refresh` to rotate the token, resets timer.
 * - "Se déconnecter" or countdown reaches 0 → calls `logout()`.
 *
 * Render this once, inside AuthProvider (e.g. in `providers.tsx`).
 */
export default function SessionTimeoutGuard() {
  const { isAuthenticated, user, logout } = useAuth();
  const isRefreshingRef = useRef(false);

  const isOwner =
    user?.role === UserRole.AGENT || user?.role === UserRole.ADMIN;
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

    try {
      const { access_token } = await authService.refreshToken();

      // Persist the new token in the correct role-specific slot.
      if (isOwner) {
        persistOwnerToken(access_token);
      } else {
        persistClientToken(access_token);
      }
    } catch {
      // If refresh fails (e.g. token already expired), force logout.
      void logout(logoutTarget);
      return;
    } finally {
      isRefreshingRef.current = false;
    }

    extendSession();
  }, [isOwner, logout, logoutTarget, extendSession]);

  if (!isAuthenticated) return null;

  return (
    <SessionTimeoutModal
      open={showWarning}
      secondsLeft={secondsLeft}
      countdownTotal={COUNTDOWN_SECONDS}
      onExtend={handleExtend}
      onLogout={() => void logout(logoutTarget)}
    />
  );
}
