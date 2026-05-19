'use client';

/**
 * useChatMessages — TanStack Query cache for a single conversation's message list.
 *
 * Owns:
 *  - Initial fetch + cursor-based load-more pagination
 *  - Reply-to quote enrichment (fills in decrypted_body quotes for E2EE parents)
 *  - Cache updater helper shared with sibling hooks
 *
 * Does NOT handle: WebSocket, E2EE decrypt, mark-as-read, reactions.
 */

import { fetchMessages } from '@/lib/chat-api';
import { enrichReplyToQuotes } from '@/lib/chat-reply-enrich';
import type { Message } from '@/types/chat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

export const CHAT_MESSAGES_STALE_MS = 23 * 60 * 60 * 1000;

export const OPTIMISTIC_PREFIX = '__optimistic__';

export const chatMessagesKey = (userId: string, conversationUuid: string) =>
  ['chat-messages', userId, conversationUuid] as const;

export interface MessagesCache {
  messages: Message[];
  hasMore: boolean;
  cursor: string | null;
}

export function prefetchChatMessages(
  queryClient: import('@tanstack/react-query').QueryClient,
  userId: string,
  conversationUuid: string
): void {
  if (!userId) return;
  void queryClient.prefetchQuery({
    queryKey: chatMessagesKey(userId, conversationUuid),
    queryFn: async () => {
      const resp = await fetchMessages(conversationUuid, null);
      return {
        messages: [...resp.data].reverse(),
        hasMore: resp.has_more,
        cursor: resp.next_cursor,
      } satisfies MessagesCache;
    },
    staleTime: CHAT_MESSAGES_STALE_MS,
  });
}

export function useChatMessages(
  userId: string,
  conversationUuid: string
): {
  messages: Message[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasMore: boolean;
  refetch: () => void;
  loadMore: () => Promise<void>;
  updateCache: (updater: (old: MessagesCache) => MessagesCache) => void;
  messagesRef: React.MutableRefObject<Message[]>;
} {
  const queryClient = useQueryClient();
  const isLoadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  const updateCache = useCallback(
    (updater: (old: MessagesCache) => MessagesCache) => {
      queryClient.setQueryData<MessagesCache>(
        chatMessagesKey(userId, conversationUuid),
        (old) => updater(old ?? { messages: [], hasMore: false, cursor: null })
      );
    },
    [queryClient, userId, conversationUuid]
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<MessagesCache>({
      queryKey: chatMessagesKey(userId, conversationUuid),
      enabled: Boolean(userId && conversationUuid),
      queryFn: async () => {
        const prev = queryClient.getQueryData<MessagesCache>(
          chatMessagesKey(userId, conversationUuid)
        );
        const resp = await fetchMessages(conversationUuid, null);
        const freshPage = [...resp.data].reverse();

        if (!prev || prev.messages.length === 0) {
          return {
            messages: freshPage,
            hasMore: resp.has_more,
            cursor: resp.next_cursor,
          };
        }

        const freshIds = new Set(freshPage.map((m) => m.uuid));
        const optimisticPending = prev.messages.filter((m) =>
          m.uuid.startsWith(OPTIMISTIC_PREFIX)
        );
        const olderTail = prev.messages.filter(
          (m) => !freshIds.has(m.uuid) && !m.uuid.startsWith(OPTIMISTIC_PREFIX)
        );

        return {
          messages: [...olderTail, ...freshPage, ...optimisticPending],
          hasMore: resp.has_more,
          cursor: resp.next_cursor,
        };
      },
      staleTime: CHAT_MESSAGES_STALE_MS,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  const messages = data?.messages ?? [];
  const hasMore = data?.hasMore ?? false;
  messagesRef.current = messages;

  // Enrich reply-to quotes with decrypted_body once messages load
  useEffect(() => {
    if (!userId || !conversationUuid || !data?.messages?.length) return;
    updateCache((old) => {
      const nextMsgs = enrichReplyToQuotes(old.messages);
      if (nextMsgs === old.messages) return old;
      return { ...old, messages: nextMsgs };
    });
  }, [conversationUuid, data?.messages, updateCache, userId]);

  const loadMore = useCallback(async () => {
    const cached = queryClient.getQueryData<MessagesCache>(
      chatMessagesKey(userId, conversationUuid)
    );
    if (!cached?.hasMore || !cached.cursor || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    try {
      const resp = await fetchMessages(conversationUuid, cached.cursor);
      updateCache((old) => ({
        messages: [...[...resp.data].reverse(), ...old.messages],
        hasMore: resp.has_more,
        cursor: resp.next_cursor,
      }));
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [conversationUuid, userId, queryClient, updateCache]);

  return {
    messages,
    isLoading,
    isFetching,
    isError,
    hasMore,
    refetch: () => {
      void refetch();
    },
    loadMore,
    updateCache,
    messagesRef,
  };
}
