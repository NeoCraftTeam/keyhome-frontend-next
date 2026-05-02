'use client';

import { getEcho } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';
import { useCallback, useEffect, useRef } from 'react';

export const TYPING_DEBOUNCE_MS = 100;
export const TYPING_STOP_AFTER_MS = 3000;
export const TYPING_HEARTBEAT_MS = 3000;

/** Receiver auto-hide must exceed heartbeat interval so we do not flicker between pulses. */
export const TYPING_RECEIVER_FALLBACK_MS =
  TYPING_HEARTBEAT_MS + TYPING_STOP_AFTER_MS + 500;

const DEBOUNCE_MS = TYPING_DEBOUNCE_MS;
const STOP_AFTER_MS = TYPING_STOP_AFTER_MS;
const HEARTBEAT_MS = TYPING_HEARTBEAT_MS;

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
 * - Auto-sends is_typing=false after 3 s of inactivity (matches WhatsApp / iMessage).
 * - No server-side HTTP endpoint needed — best-effort, zero latency.
 *
 * Usage:
 *   const { notifyTyping } = useTypingIndicator(conversationUuid);
 *   // call notifyTyping() on every keystroke in the message input
 */
export function useTypingIndicator(conversationUuid: string): {
  notifyTyping: () => void;
  stopTyping: () => void;
  setVoiceRecordingActive: (active: boolean) => void;
} {
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);
  const isVoiceRecordingRef = useRef(false);

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
  const whisperVoiceRecording = useCallback(
    (active: boolean) => {
      try {
        const echo = getEcho();
        const ch = echo.private(`conversation.${conversationUuid}`);
        ch.whisper('voice_recording', {
          user_id: user?.id,
          is_recording: active,
        });
      } catch {
        // best-effort
      }
    },
    [conversationUuid, user?.id]
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const setVoiceRecordingActive = useCallback(
    (active: boolean) => {
      isVoiceRecordingRef.current = active;
      whisperVoiceRecording(active);
    },
    [whisperVoiceRecording]
  );

  const stopTyping = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
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

  // Send is_typing=false and voice_recording=false on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isTypingRef.current) stopTyping();
      if (isVoiceRecordingRef.current) {
        isVoiceRecordingRef.current = false;
        whisperVoiceRecording(false);
      }
    },
    [stopTyping, whisperVoiceRecording]
  );

  return { notifyTyping, stopTyping, setVoiceRecordingActive };
}
