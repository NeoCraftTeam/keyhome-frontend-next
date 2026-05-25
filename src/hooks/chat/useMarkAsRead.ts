'use client';

/**
 * useMarkAsRead — auto mark-as-read on focus + Page Visibility API.
 *
 * Owns:
 *  - `markConversationAsRead` API call
 *  - Reset unread_count in conversations list cache
 *  - Reset global unread badge cache
 *  - window focus + document visibilitychange listeners
 */

import { markConversationAsRead } from '@/lib/chat/chat-api';
import { chatKeys } from '@/lib/query-keys';
import type { Conversation, UnreadCountResponse } from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import type { User } from '@/types/user';

export function useMarkAsRead(
  conversationUuid: string,
  user: User | null | undefined
): { markAsRead: () => void } {
  const queryClient = useQueryClient();

  const markAsRead = useCallback(() => {
    if (!user) return;
    const userId = user.id;

    void markConversationAsRead(conversationUuid)
      .then(() => {
        // Reset this conversation's unread_count in the conversations list
        queryClient.setQueryData<{ data: Conversation[]; meta: unknown }>(
          chatKeys.conversations(userId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((c) =>
                c.uuid === conversationUuid ? { ...c, unread_count: 0 } : c
              ),
            };
          }
        );
        // Reset the global unread summary badge
        queryClient.setQueryData<UnreadCountResponse>(
          chatKeys.unread(userId),
          (old) => {
            if (!old) return old;
            const conv = old.conversations.find(
              (c) => c.uuid === conversationUuid
            );
            const delta = conv?.count ?? 0;
            if (delta === 0) return old;
            return {
              total: Math.max(0, old.total - delta),
              conversations: old.conversations.map((c) =>
                c.uuid === conversationUuid ? { ...c, count: 0 } : c
              ),
            };
          }
        );
      })
      .catch(() => {});
  }, [conversationUuid, queryClient, user]);

  // Auto mark-as-read on window focus + PWA background return
  useEffect(() => {
    const onFocus = () => markAsRead();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') markAsRead();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [markAsRead]);

  return { markAsRead };
}
