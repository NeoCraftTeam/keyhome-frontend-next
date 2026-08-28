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

import { fetchMessages, fetchMessagesAfter } from '@/lib/chat/chat-api';
import { enrichReplyToQuotes } from '@/lib/chat/chat-reply-enrich';
import type { Message } from '@/types/chat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

export const CHAT_MESSAGES_STALE_MS = 23 * 60 * 60 * 1000;

export const OPTIMISTIC_PREFIX = '__optimistic__';

/** Safety cap on the delta catch-up loop (200 msgs/page → 4000 messages). */
const DELTA_SYNC_MAX_PAGES = 20;

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
  syncDelta: () => Promise<void>;
  updateCache: (updater: (old: MessagesCache) => MessagesCache) => void;
  messagesRef: React.MutableRefObject<Message[]>;
} {
  const queryClient = useQueryClient();
  const isLoadingMoreRef = useRef(false);
  const isSyncingDeltaRef = useRef(false);
  const deltaBootstrappedForRef = useRef<string | null>(null);
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

  const { data, isLoading, isFetching, isError, refetch, isFetchedAfterMount } =
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
      // WhatsApp Web model: never refetch the whole first page on focus — the
      // cached history stays visible and `syncDelta` pulls only the messages
      // that arrived since (see the delta-sync effect below).
      refetchOnWindowFocus: false,
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

  // WhatsApp Web-style incremental sync. The cached history stays on screen;
  // this only pulls messages created after the latest one we already hold,
  // using its UTC timestamp as the cursor (timezone-independent). Newly synced
  // messages are appended in place with UUID dedupe — never a full page reload.
  const syncDelta = useCallback(async () => {
    if (!userId || !conversationUuid || isSyncingDeltaRef.current) return;

    const cached = queryClient.getQueryData<MessagesCache>(
      chatMessagesKey(userId, conversationUuid)
    );
    // Cold cache (new device / first open): the initial useQuery fetch pulls
    // the full first page — nothing to delta against yet.
    if (!cached || cached.messages.length === 0) return;

    // Cursor = the latest settled (non-optimistic) message's UTC timestamp.
    let cursor: string | null = null;
    for (let i = cached.messages.length - 1; i >= 0; i--) {
      const m = cached.messages[i];
      if (m.uuid.startsWith(OPTIMISTIC_PREFIX)) continue;
      cursor = m.created_at;
      break;
    }
    if (!cursor) return;

    let after: string = cursor;
    isSyncingDeltaRef.current = true;
    try {
      for (let page = 0; page < DELTA_SYNC_MAX_PAGES; page++) {
        const resp = await fetchMessagesAfter(conversationUuid, after);
        if (resp.data.length === 0) break;

        let newest: string = after;
        for (const m of resp.data) {
          if (m.created_at > newest) newest = m.created_at;
        }

        updateCache((old) => {
          const known = new Set(old.messages.map((m) => m.uuid));
          const fresh = resp.data.filter((m) => !known.has(m.uuid));
          if (fresh.length === 0) return old;
          // The delta is oldest-first and strictly newer than the settled
          // tail; append it while keeping optimistic-pending sends last
          // (mirrors the queryFn merge order).
          const settled = old.messages.filter(
            (m) => !m.uuid.startsWith(OPTIMISTIC_PREFIX)
          );
          const optimistic = old.messages.filter((m) =>
            m.uuid.startsWith(OPTIMISTIC_PREFIX)
          );
          return { ...old, messages: [...settled, ...fresh, ...optimistic] };
        });

        // Long-absence catch-up: keep pulling while the server flags more,
        // advancing the cursor. A stalled cursor guards against a loop.
        if (!resp.has_more || newest === after) break;
        after = newest;
      }
    } finally {
      isSyncingDeltaRef.current = false;
    }
  }, [conversationUuid, userId, queryClient, updateCache]);

  // Bootstrap the delta once the list is available from the restored (encrypted)
  // cache rather than a fresh network fetch: `isFetchedAfterMount` is false when
  // the data came straight from the persisted snapshot (WhatsApp Web instant
  // open), so that's exactly when we need to catch up on what arrived since.
  useEffect(() => {
    if (!userId || !conversationUuid) return;
    if (!data || data.messages.length === 0) return;
    const key = `${userId}:${conversationUuid}`;
    if (deltaBootstrappedForRef.current === key) return;
    deltaBootstrappedForRef.current = key;
    if (!isFetchedAfterMount) void syncDelta();
  }, [userId, conversationUuid, data, isFetchedAfterMount, syncDelta]);

  // Re-sync when the tab regains focus / visibility, replacing the old
  // full-page refetch-on-focus with a targeted UTC-timestamp delta.
  useEffect(() => {
    if (!userId || !conversationUuid) return;
    const onFocus = () => void syncDelta();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncDelta();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, conversationUuid, syncDelta]);

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
    syncDelta,
    updateCache,
    messagesRef,
  };
}
