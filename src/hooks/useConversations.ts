'use client';

import { fetchConversations, fetchUnreadCount } from '@/lib/chat-api';
import { chatMessagesKey, prefetchChatMessages } from './useChat';
import type { MessagesCache } from './useChat';
import type { Conversation, Message, UnreadCountResponse } from '@/types/chat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getEcho } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';

const CONVERSATIONS_KEY = ['conversations'] as const;
const UNREAD_KEY = ['chat-unread'] as const;

/**
 * Manages the conversation list with real-time updates and global cache sync.
 *
 * Enterprise caching strategy:
 * - staleTime Infinity — WS events keep conversation list live in real-time.
 *   Reconnect handler (in ChatNotificationListener) invalidates on WS reconnect.
 * - gcTime 30min — cache survives long navigation away from messages.
 * - Global message cache sync — message.sent events push into the per-conversation
 *   TanStack messages cache so data is ready before the user opens a conversation.
 * - Proactive prefetch — top 3 conversations' messages are prefetched on first load.
 */
export function useConversations(): {
  conversations: Conversation[];
  isLoading: boolean;
  unread: UnreadCountResponse | undefined;
  refetch: () => void;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => fetchConversations(),
    enabled: !!user,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: unread } = useQuery({
    queryKey: UNREAD_KEY,
    queryFn: fetchUnreadCount,
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60_000,
  });

  const conversations = data?.data ?? [];

  // Build a stable string of conversation UUIDs to detect changes
  const convUuids = conversations
    .map((c) => c.uuid)
    .sort()
    .join(',');
  const prevUuidsRef = useRef(convUuids);

  // ─── Proactive prefetch: warm cache for top conversations on first load ────
  const hasPrefetchedRef = useRef(false);
  useEffect(() => {
    if (hasPrefetchedRef.current || conversations.length === 0) return;
    hasPrefetchedRef.current = true;
    // Prefetch messages for the 3 most recent conversations
    conversations.slice(0, 3).forEach((conv) => {
      prefetchChatMessages(queryClient, conv.uuid);
    });
  }, [conversations, queryClient]);

  // ─── WS subscriptions with global message cache sync ───────────────────────
  // Uses direct Pusher bind/unbind so cleanup doesn't call echo.leave(),
  // which would destroy subscriptions shared with ChatNotificationListener and useChat.
  useEffect(() => {
    if (!user || !convUuids) return;
    prevUuidsRef.current = convUuids;

    const echo = getEcho();
    const uuids = convUuids.split(',');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: Array<{
      pusherCh: any;
      handler: (event: Message) => void;
    }> = [];

    // Track per-UUID retry state so cleanup can cancel pending retries.
    const retryTimers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    uuids.forEach((uuid) => {
      const channelName = `conversation.${uuid}`;
      // echo.private() is idempotent — returns existing channel if already subscribed
      const echoChannel = echo.private(channelName);

      const handler = (event: Message) => {
        // 1. Move conversation to top with updated preview
        queryClient.setQueryData(CONVERSATIONS_KEY, (old: typeof data) => {
          if (!old) return old;
          const updated = old.data.map((c) =>
            c.uuid === event.conversation_uuid
              ? {
                  ...c,
                  last_message: event,
                  last_message_at: event.created_at,
                  unread_count:
                    event.sender_id !== user.id
                      ? c.unread_count + 1
                      : c.unread_count,
                }
              : c
          );
          updated.sort((a, b) =>
            (b.last_message_at ?? '') > (a.last_message_at ?? '') ? 1 : -1
          );
          return { ...old, data: updated };
        });

        // 2. Global message cache sync — push the new message into the
        //    per-conversation messages cache so it's already there when the
        //    user opens the conversation. Only update if cache exists (don't
        //    create empty caches for conversations not yet visited).
        const msgKey = chatMessagesKey(event.conversation_uuid);
        queryClient.setQueryData<MessagesCache>(msgKey, (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.uuid === event.uuid)) return old;
          return { ...old, messages: [...old.messages, event] };
        });

        // Unread badge is updated directly by ChatNotificationListener (always mounted)
        // so no invalidation needed here — avoids a redundant network request.
      };

      // Race-safe binding: pusher subscription may not be set synchronously.
      // Retry up to 1s (20 × 50ms) until ready, then bind once.
      let attempts = 0;
      const tryBind = () => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pusherCh = (echoChannel as any).subscription;
        if (!pusherCh) {
          if (attempts++ < 20) {
            const t = setTimeout(tryBind, 50);
            retryTimers.push(t);
          }
          return;
        }
        pusherCh.bind('message.sent', handler);
        bindings.push({ pusherCh, handler });
      };
      tryBind();
    });

    return () => {
      cancelled = true;
      retryTimers.forEach((t) => clearTimeout(t));
      // Only unbind our handlers — NEVER call echo.leave() on shared channels
      bindings.forEach(({ pusherCh, handler }) => {
        pusherCh.unbind('message.sent', handler);
      });
    };
  }, [user, convUuids, queryClient]);

  return { conversations, isLoading, unread, refetch };
}
