'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** User-activity events that reset the idle timer. */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'pointerdown',
];

/**
 * BroadcastChannel name for cross-tab session keep-alive.
 * When the user extends the session in one tab, all other tabs reset their
 * idle timers so the warning does not appear simultaneously everywhere.
 */
const BC_CHANNEL = 'kh:session-keep-alive';

interface UseIdleTimeoutOptions {
  /** Idle duration (ms) before the warning appears. Default: 15 min. */
  idleMs?: number;
  /** Countdown duration (ms) shown in the warning. Default: 60 s. */
  countdownMs?: number;
  /** Called when the countdown reaches 0 without user action. */
  onTimeout: () => void;
  /** Whether the timer is active. Typically `isAuthenticated`. */
  enabled?: boolean;
}

interface UseIdleTimeoutReturn {
  /** `true` when the warning modal should be displayed. */
  showWarning: boolean;
  /** Seconds remaining before auto-logout. */
  secondsLeft: number;
  /**
   * Call this when the user confirms they want to stay.
   * Resets the idle timer and broadcasts the extend event to other tabs.
   */
  extendSession: () => void;
}

/**
 * Tracks user inactivity and triggers a warning before auto-logout.
 *
 * Features:
 * - Activity events reset the idle timer while the warning is hidden.
 * - Page Visibility API: when the tab becomes visible after being hidden,
 *   elapsed idle time is recalculated so the correct warning/timeout state
 *   is shown immediately (no false 15-min grace period after returning).
 * - BroadcastChannel: extending the session in one tab resets all other
 *   tabs of the same origin, preventing simultaneous warning spam.
 *
 * Flow:
 * 1. User is active → idle timer resets on every activity event.
 * 2. User goes idle for `idleMs` → `showWarning` becomes `true`.
 * 3. A countdown of `countdownMs` starts — displayed in the modal.
 * 4. If user clicks "Prolonger" → `extendSession()` resets everything + broadcasts.
 * 5. If countdown hits 0 → `onTimeout()` fires (logout).
 */
export function useIdleTimeout({
  idleMs = 15 * 60 * 1000,
  countdownMs = 60 * 1000,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(countdownMs / 1000));

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const lastActivityRef = useRef(Date.now());
  const warningActiveRef = useRef(false);

  onTimeoutRef.current = onTimeout;

  /* ── Helpers ───────────────────────────────────────────────── */

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  /** Start (or restart) the countdown with an optional custom initial value. */
  const startCountdown = useCallback(
    (initialSeconds?: number) => {
      clearCountdown();
      const secs = initialSeconds ?? Math.ceil(countdownMs / 1000);
      warningActiveRef.current = true;
      setShowWarning(true);
      setSecondsLeft(secs);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearCountdown();
            onTimeoutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [countdownMs, clearCountdown]
  );

  /* ── Core: reset idle timer ────────────────────────────────── */

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningActiveRef.current = false;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    clearCountdown();
    setShowWarning(false);
    setSecondsLeft(Math.ceil(countdownMs / 1000));

    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleMs);
  }, [idleMs, countdownMs, clearCountdown, startCountdown]);

  /* ── Activity listeners + initial start ────────────────────── */

  useEffect(() => {
    if (!enabled) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
      setShowWarning(false);
      warningActiveRef.current = false;
      return;
    }

    const handleActivity = () => {
      // While the warning modal is open, only extendSession() can reset.
      if (!warningActiveRef.current) {
        resetIdleTimer();
      }
    };

    resetIdleTimer();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [enabled, resetIdleTimer, clearCountdown]);

  /* ── Page Visibility API ───────────────────────────────────── */

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= idleMs + countdownMs) {
        // The full idle + countdown period has elapsed while the tab was
        // in the background — trigger logout immediately on return.
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        clearCountdown();
        warningActiveRef.current = false;
        onTimeoutRef.current();
      } else if (elapsed >= idleMs && !warningActiveRef.current) {
        // The idle period has elapsed but we are still inside the countdown
        // window — show the warning with the correct remaining seconds.
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        const remaining = Math.max(
          1,
          Math.ceil((idleMs + countdownMs - elapsed) / 1000)
        );
        startCountdown(remaining);
      }
      // Otherwise the idle timer is still ticking correctly — no action needed.
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, idleMs, countdownMs, clearCountdown, startCountdown]);

  /* ── BroadcastChannel: cross-tab session keep-alive ─────────── */

  useEffect(() => {
    if (
      !enabled ||
      typeof window === 'undefined' ||
      !('BroadcastChannel' in window)
    )
      return;

    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_CHANNEL);
    } catch {
      return;
    }

    bc.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data?.type === 'extend') {
        // Another tab extended the session — silently reset our timer too.
        resetIdleTimer();
      }
    };

    return () => {
      bc.close();
    };
  }, [enabled, resetIdleTimer]);

  /* ── Public: extend session ────────────────────────────────── */

  const extendSession = useCallback(() => {
    resetIdleTimer();

    // Notify other tabs so they also reset and don't show the warning.
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.postMessage({ type: 'extend' });
        bc.close();
      } catch {
        // BroadcastChannel unavailable in some environments — safe to ignore.
      }
    }
  }, [resetIdleTimer]);

  return { showWarning, secondsLeft, extendSession };
}
