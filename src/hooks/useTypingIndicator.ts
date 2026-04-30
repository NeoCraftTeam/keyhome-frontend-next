'use client';

import { getEcho } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';
import { useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_MS = 100;
const STOP_AFTER_MS = 1000;
const HEARTBEAT_MS = 3000;

/**
 * Typing indicator hook — sends typing events via Pusher client events (whisper).
 *
 * Whisper bypasses the HTTP round-trip: the event travels directly from the
 * browser over the already-open WebSocket connection to Reverb, which immediately
 * forwards it to the other participant on the same channel.
 *
 * Requires REVERB_APP_ACCEPT_CLIENT_EVENTS_FROM=all in the backend .env so that
 * Reverb accepts client events on private channels.
 *
 * - Debounces keystrokes 100 ms before sending.
 * - Heartbeat re-sends is_typing=true every 3 s while active so the receiver's
 *   safety timeout never fires during continuous long-form typing.
 * - Auto-sends is_typing=false after 5 s of inactivity.
 * - No server-side HTTP endpoint needed — best-effort, zero latency.
 *
 * Usage:
 *   const { notifyTyping } = useTypingIndicator(conversationUuid);
 *   // call notifyTyping() on every keystroke in the message input
 */
export function useTypingIndicator(conversationUuid: string): {
  notifyTyping: () => void;
  stopTyping: () => void;
} {
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);

  /* eslint-disable react-hooks/preserve-manual-memoization */
  const whisperTyping = useCallback(
    (isTyping: boolean) => {
      try {
        const echo = getEcho();
        const ch = echo.private(`conversation.${conversationUuid}`);
        ch.whisper('typing', { user_id: user?.id, is_typing: isTyping });
      } catch {
        // Whisper is best-effort — ignore errors
      }
    },
    [conversationUuid, user?.id]
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const stopTyping = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (stopRef.current) {
      clearTimeout(stopRef.current);
      stopRef.current = null;
    }
    isTypingRef.current = false;
    whisperTyping(false);
  }, [whisperTyping]);

  const notifyTyping = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        whisperTyping(true);
        // Heartbeat: keep the receiver's safety timeout alive during long typing sessions.
        heartbeatRef.current = setInterval(() => {
          if (isTypingRef.current) whisperTyping(true);
        }, HEARTBEAT_MS);
      }

      // Reset the inactivity stop timer on every keystroke.
      if (stopRef.current) clearTimeout(stopRef.current);
      stopRef.current = setTimeout(stopTyping, STOP_AFTER_MS);
    }, DEBOUNCE_MS);
  }, [whisperTyping, stopTyping]);

  // Send is_typing=false on unmount so the indicator clears immediately.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isTypingRef.current) stopTyping();
    },
    [stopTyping]
  );

  return { notifyTyping, stopTyping };
}
