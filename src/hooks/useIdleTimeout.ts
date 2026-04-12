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
  /** Call this to dismiss the warning and reset the idle timer. */
  extendSession: () => void;
}

/**
 * Tracks user inactivity and triggers a warning before auto-logout.
 *
 * Flow:
 * 1. User is active → idle timer resets on every activity event.
 * 2. User goes idle for `idleMs` → `showWarning` becomes `true`.
 * 3. A countdown of `countdownMs` starts — displayed in the modal.
 * 4. If user clicks "Prolonger" → `extendSession()` resets everything.
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
  onTimeoutRef.current = onTimeout;

  /* ── Reset idle timer ──────────────────────────────────────── */

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setShowWarning(false);
    setSecondsLeft(Math.ceil(countdownMs / 1000));

    idleTimerRef.current = setTimeout(() => {
      // Idle threshold reached — start countdown.
      setShowWarning(true);
      setSecondsLeft(Math.ceil(countdownMs / 1000));

      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            onTimeoutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, idleMs);
  }, [idleMs, countdownMs]);

  /* ── Activity listeners ────────────────────────────────────── */

  useEffect(() => {
    if (!enabled) {
      // Cleanup everything when disabled (user logged out).
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      // Only reset if the warning is NOT yet visible.
      // Once the warning is shown, only extendSession() can reset.
      if (!countdownRef.current) {
        resetIdleTimer();
      }
    };

    // Start the idle timer.
    resetIdleTimer();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, handleActivity, { passive: true });
    }

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, handleActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, resetIdleTimer]);

  /* ── Public: extend session ────────────────────────────────── */

  const extendSession = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return { showWarning, secondsLeft, extendSession };
}
