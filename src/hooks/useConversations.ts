'use client';

import { fetchConversations, fetchUnreadCount } from '@/lib/chat/chat-api';
import { selectConversationsForBackgroundWs } from '@/lib/chat/chat-subscriptions';
import { chatKeys } from '@/lib/query-keys';
import { prefetchChatMessages } from './useChat';
import type { Conversation, UnreadCountResponse } from '@/types/chat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Conversation list for the Messages UI. Real-time list preview + ordering
 * are kept in sync by {@link ChatNotificationListener} (always mounted in both
 * panels) so the cache stays correct even when this hook is not active.
 */
export function useConversations(): {
  conversations: Conversation[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  unread: UnreadCountResponse | undefined;
  refetch: () => void;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listKey = user
    ? chatKeys.conversations(user.id)
    : chatKeys.conversations('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchConversations(),
    enabled: !!user,
    // Real-time WS updates keep the list fresh in normal operation. When WS
    // misses an event (reconnect race, mobile suspend, multi-device send), a
    // short staleTime + focus refetch acts as a safety net so previews never
    // stay stuck on an older message.
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    // `true` (not `'always'`): revalidate on mount only when stale. With the
    // persistent shell + WS keeping the list fresh, `'always'` refired a fetch
    // on every mount → an `isFetching` flash against already-warm data.
    refetchOnMount: true,
  });

  const { data: unread } = useQuery({
    queryKey: user ? chatKeys.unread(user.id) : chatKeys.unread(''),
    queryFn: fetchUnreadCount,
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60_000,
  });

  const conversations = data?.data ?? [];

  // ─── Proactive prefetch: warm cache for top conversations on first load ────
  const hasPrefetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastUserIdRef.current !== user?.id) {
      lastUserIdRef.current = user?.id;
      hasPrefetchedRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (hasPrefetchedRef.current || conversations.length === 0 || !user?.id) {
      return;
    }
    hasPrefetchedRef.current = true;
    selectConversationsForBackgroundWs(conversations)
      .slice(0, 3)
      .forEach((conv) => {
        prefetchChatMessages(queryClient, user.id, conv.uuid);
      });
  }, [conversations, queryClient, user?.id]);

  return {
    conversations,
    isLoading,
    isError,
    error: error ?? null,
    unread,
    refetch,
  };
}
