'use client';

import { getEcho } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';
import type { Conversation, TypingEvent } from '@/types/chat';
import { useEffect, useMemo, useRef, useState } from 'react';

/** Safety timeout: clear the indicator if we don't receive a stop event within 2 s. */
const TYPING_EXPIRE_MS = 2000;

/** Max simultaneous channel subscriptions for typing — prevents WS overload. */
const MAX_TYPING_SUBS = 20;

/**
 * Subscribes to typing whispers on ALL conversation channels simultaneously.
 *
 * Returns a map of `{ [conversationUuid]: true }` for every conversation where
 * the OTHER participant is currently typing. Entries are cleared when a
 * `is_typing=false` event arrives or after a 7-second safety timeout.
 *
 * Re-subscribes only when the set of conversation UUIDs changes, not on every
 * render. Whisper listeners are removed on cleanup without leaving the channel
 * (so ChatWindow's own subscription on the active channel is unaffected).
 */
export function useConversationsTyping(
  conversations: Conversation[]
): Record<string, boolean> {
  const { user } = useAuth();
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const uuidsKey = useMemo(
    () =>
      conversations
        .slice(0, MAX_TYPING_SUBS)
        .map((c) => c.uuid)
        .join(','),
    [conversations]
  );

  useEffect(() => {
    const uuids = uuidsKey ? uuidsKey.split(',') : [];
    if (!uuids.length) return;

    let echo: ReturnType<typeof getEcho>;
    try {
      echo = getEcho();
    } catch {
      return;
    }

    type HandlerEntry = { uuid: string; handler: (e: TypingEvent) => void };
    const handlers: HandlerEntry[] = [];

    for (const uuid of uuids) {
      const captured = uuid;
      const handler = (event: TypingEvent) => {
        if (event.user_id === user?.id) return;

        setTypingMap((prev) => ({ ...prev, [captured]: event.is_typing }));

        if (timeoutsRef.current[captured]) {
          clearTimeout(timeoutsRef.current[captured]);
          delete timeoutsRef.current[captured];
        }

        if (event.is_typing) {
          timeoutsRef.current[captured] = setTimeout(() => {
            setTypingMap((prev) => ({ ...prev, [captured]: false }));
          }, TYPING_EXPIRE_MS);
        }
      };

      try {
        echo
          .private(`conversation.${uuid}`)
          .listenForWhisper('typing', handler);
        handlers.push({ uuid, handler });
      } catch {
        // Echo not yet initialised — typing in this conversation won't show
      }
    }

    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};

      for (const { uuid, handler } of handlers) {
        try {
          getEcho()
            .private(`conversation.${uuid}`)
            .stopListeningForWhisper('typing', handler);
        } catch {
          // ignore
        }
      }
    };
    // uuidsKey is a stable primitive — correct dep
  }, [uuidsKey, user?.id]);

  return typingMap;
}
