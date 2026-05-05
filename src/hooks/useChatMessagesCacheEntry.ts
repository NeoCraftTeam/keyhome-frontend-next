'use client';

import type { MessagesCache } from '@/hooks/useChat';
import { chatMessagesKey } from '@/hooks/useChat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to the TanStack cache entry for one conversation's messages so list
 * rows (e.g. {@link ConversationItem}) re-render when the thread cache gets
 * `decrypted_body` updates without refetching the inbox.
 *
 * `getServerSnapshot` must match `getSnapshot` (same function) — a constant
 * `undefined` server snapshot while the client reads dehydrated `chat-messages`
 * causes a hydration mismatch and breaks clicks / interactivity in Next.js.
 */
export function useChatMessagesCacheEntry(
  userId: string | undefined,
  conversationUuid: string
): MessagesCache | undefined {
  const queryClient = useQueryClient();
  const key = userId ? chatMessagesKey(userId, conversationUuid) : null;

  const getSnapshot = useCallback((): MessagesCache | undefined => {
    return key != null
      ? queryClient.getQueryData<MessagesCache>(key)
      : undefined;
  }, [key, queryClient]);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (key == null) {
        return () => {};
      }

      return queryClient.getQueryCache().subscribe((event) => {
        const qk = event?.query?.queryKey as unknown[] | undefined;
        if (qk == null || qk.length < 3) {
          return;
        }
        if (
          qk[0] !== 'chat-messages' ||
          qk[1] !== userId ||
          qk[2] !== conversationUuid
        ) {
          return;
        }
        onStoreChange();
      });
    },
    [key, queryClient, userId, conversationUuid]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
