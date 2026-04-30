'use client';

import {
  deleteMessage,
  fetchMessages,
  markConversationAsRead,
  sendMessage,
  uploadAttachment,
} from '@/lib/chat-api';
import { getEcho, useEchoConnectionState } from '@/lib/echo';
import type {
  Conversation,
  Message,
  MessageAttachment,
  TypingEvent,
  UnreadCountResponse,
} from '@/types/chat';
import type { DeviceType } from './usePresence';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePresence } from './usePresence';
import { useTypingIndicator } from './useTypingIndicator';
import { useAuth } from '@/providers/AuthProvider';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type QueuedMessage = {
  body: string;
  attachments?: MessageAttachment[];
  replyToId?: string;
};

const OPTIMISTIC_PREFIX = '__optimistic__';

export const chatMessagesKey = (uuid: string) =>
  ['chat-messages', uuid] as const;

/**
 * Prefetch messages for a conversation into the TanStack cache.
 * Call on hover/touch of a ConversationItem so data is ready when the user taps.
 */
export function prefetchChatMessages(
  queryClient: QueryClient,
  conversationUuid: string
) {
  void queryClient.prefetchQuery({
    queryKey: chatMessagesKey(conversationUuid),
    queryFn: async () => {
      const resp = await fetchMessages(conversationUuid, null);
      return {
        messages: [...resp.data].reverse(),
        hasMore: resp.has_more,
        cursor: resp.next_cursor,
      } satisfies MessagesCache;
    },
    staleTime: Infinity,
  });
}

export interface MessagesCache {
  messages: Message[];
  hasMore: boolean;
  cursor: string | null;
}

/**
 * Main chat hook for a single conversation.
 *
 * Features:
 * - TanStack Query caching — revisiting a conversation shows messages instantly
 * - Cursor-based "load more" pagination (oldest first display)
 * - Optimistic message sends (appears instantly, replaced by server response)
 * - WebSocket subscriptions: MessageSent, MessageRead, MessageDeleted, UserTyping
 * - Auto mark-as-read when window is focused and user is on the conversation
 * - Typing detection (debounced 100ms)
 * - File upload with progress
 * - Presence status for the other participant
 */
export function useChat(
  conversationUuid: string,
  otherParticipantId: string
): {
  messages: Message[];
  isLoading: boolean;
  isFetching: boolean;
  hasMore: boolean;
  loadMore: () => void;
  sendMessage: (
    body: string,
    attachments?: MessageAttachment[],
    replyToId?: string
  ) => Promise<void>;
  uploadFile: (
    file: File,
    onProgress?: (pct: number) => void
  ) => Promise<MessageAttachment>;
  deleteMessage: (uuid: string) => Promise<void>;
  setReplyTo: (message: Message | null) => void;
  replyTo: Message | null;
  otherIsTyping: boolean;
  onlineStatus: 'online' | 'offline' | 'unknown';
  presenceDevice: DeviceType;
  notifyTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  /** Number of messages queued while offline — flushes automatically on reconnect. */
  queuedCount: number;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const offlineQueueRef = useRef<QueuedMessage[]>([]);
  const connectionState = useEchoConnectionState();

  const { notifyTyping, stopTyping } = useTypingIndicator(conversationUuid);
  const { status: onlineStatus, device: presenceDevice } =
    usePresence(otherParticipantId);

  const isLoadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref so handleSendMessage closure always reads the latest presence without stale capture
  const onlineStatusRef = useRef(onlineStatus);
  useEffect(() => {
    onlineStatusRef.current = onlineStatus;
  }, [onlineStatus]);

  // ─── TanStack Query: message fetch + cache ────────────────────────────────
  // staleTime Infinity → messages are immutable, WS events push new ones into
  // cache in real-time (via useChat + ChatNotificationListener global sync).
  // Reconnect handler invalidates on WS reconnect to catch missed events.
  // gcTime 30min → cache survives long navigation away from messages.

  const { data, isLoading, isFetching } = useQuery<MessagesCache>({
    queryKey: chatMessagesKey(conversationUuid),
    queryFn: async () => {
      const resp = await fetchMessages(conversationUuid, null);
      return {
        messages: [...resp.data].reverse(),
        hasMore: resp.has_more,
        cursor: resp.next_cursor,
      };
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const messages = data?.messages ?? [];
  const hasMore = data?.hasMore ?? false;
  messagesRef.current = messages;

  // Helper: update the React Query cache directly
  const updateCache = useCallback(
    (updater: (old: MessagesCache) => MessagesCache) => {
      queryClient.setQueryData<MessagesCache>(
        chatMessagesKey(conversationUuid),
        (old) => updater(old ?? { messages: [], hasMore: false, cursor: null })
      );
    },
    [queryClient, conversationUuid]
  );

  // ─── Load older messages ─────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    const cached = queryClient.getQueryData<MessagesCache>(
      chatMessagesKey(conversationUuid)
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
  }, [conversationUuid, queryClient, updateCache]);

  // ─── Mark as read ────────────────────────────────────────────────────────

  const markAsRead = useCallback(() => {
    void markConversationAsRead(conversationUuid)
      .then(() => {
        // Reset this conversation's unread_count in the conversations list cache
        queryClient.setQueryData<{ data: Conversation[]; meta: unknown }>(
          ['conversations'],
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
          ['chat-unread'],
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
  }, [conversationUuid, queryClient]);

  // Auto mark-as-read on focus
  useEffect(() => {
    const onFocus = () => markAsRead();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [markAsRead]);

  // Upgrade own sent messages → delivered when recipient comes online
  useEffect(() => {
    if (onlineStatus !== 'online') return;
    updateCache((old) => ({
      ...old,
      messages: old.messages.map((m) =>
        m.sender_id === user?.id && m.status === 'sent'
          ? { ...m, status: 'delivered' as const }
          : m
      ),
    }));
  }, [onlineStatus, user?.id, updateCache]);

  // ─── WebSocket subscriptions ─────────────────────────────────────────────
  // Uses direct Pusher bind/unbind so cleanup doesn't call echo.leave(),
  // which would destroy subscriptions shared with ChatNotificationListener
  // and useConversations on the same conversation channel.

  useEffect(() => {
    const echo = getEcho();
    const echoChannel = echo.private(`conversation.${conversationUuid}`);

    const onMessageSent = (event: Message) => {
      updateCache((old) => {
        if (old.messages.some((m) => m.uuid === event.uuid)) return old;
        return { ...old, messages: [...old.messages, event] };
      });
      if (document.hasFocus()) markAsRead();
    };

    const onMessagesRead = (event: { reader_id: string; read_at: string }) => {
      if (event.reader_id !== user?.id) {
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) =>
            m.sender_id === user?.id && m.status !== 'read'
              ? { ...m, status: 'read' as const, read_at: event.read_at }
              : m
          ),
        }));
      }
    };

    const onMessageDeleted = (event: { message_uuid: string }) => {
      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) =>
          m.uuid === event.message_uuid
            ? { ...m, body: null, deleted_at: new Date().toISOString() }
            : m
        ),
      }));
    };

    const onUserTyping = (event: TypingEvent) => {
      if (event.user_id === otherParticipantId) {
        setOtherIsTyping(event.is_typing);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (event.is_typing) {
          typingTimeoutRef.current = setTimeout(
            () => setOtherIsTyping(false),
            2000
          );
        }
      }
    };

    const handlers: Array<[string, (e: never) => void]> = [
      ['message.sent', onMessageSent as (e: never) => void],
      ['messages.read', onMessagesRead as (e: never) => void],
      ['message.deleted', onMessageDeleted as (e: never) => void],
      ['client-typing', onUserTyping as (e: never) => void],
    ];

    // ─── Race-safe binding ─────────────────────────────────────────────────
    // echo.private(name).subscription is normally set synchronously by laravel-echo's
    // PusherChannel constructor, but we observed cases (StrictMode, fast nav,
    // freshly-recreated singleton after disconnectEcho()) where it was momentarily
    // undefined or where bind() before subscription_succeeded silently dropped events.
    // We retry until the underlying Pusher channel is available, then bind once.
    // Pattern matches usePresence.ts.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pusherCh: any = null;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const tryBind = () => {
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pusherCh = (echoChannel as any).subscription;
      if (!pusherCh) {
        if (attempts++ < 20) {
          retryTimer = setTimeout(tryBind, 50);
        } else if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[useChat] Pusher subscription never ready for',
            conversationUuid
          );
        }
        return;
      }
      handlers.forEach(([event, handler]) => pusherCh.bind(event, handler));
      if (process.env.NODE_ENV === 'development') {
        // Diagnostic: subscription state events. If you only see "Bound …" but
        // never "subscription_succeeded", the channel auth is failing (check
        // Network tab for /broadcasting/auth → expect 200 + {auth: "key:hash"}).
        const onSubSuccess = () => {
          console.info(
            '%c[useChat] ✓ subscribed to conversation.' + conversationUuid,
            'color:#10b981;font-weight:bold'
          );
        };
        const onSubError = (err: unknown) => {
          console.error(
            '[useChat] ✗ subscription_error for conversation.' +
              conversationUuid,
            err
          );
        };
        pusherCh.bind('pusher:subscription_succeeded', onSubSuccess);
        pusherCh.bind('pusher:subscription_error', onSubError);
        // Push these into handlers so cleanup unbinds them too.
        handlers.push([
          'pusher:subscription_succeeded',
          onSubSuccess as (e: never) => void,
        ]);
        handlers.push([
          'pusher:subscription_error',
          onSubError as (e: never) => void,
        ]);
        console.debug(
          '[useChat] Bound handlers for conversation.' + conversationUuid
        );
      }
    };

    tryBind();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      // Only unbind our handlers — NEVER call echo.leave() on shared channels
      if (pusherCh) {
        handlers.forEach(([event, handler]) => pusherCh.unbind(event, handler));
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationUuid, otherParticipantId, user?.id, markAsRead, updateCache]);

  // ─── Flush offline queue on reconnect ────────────────────────────────────
  useEffect(() => {
    if (connectionState !== 'connected') return;
    if (offlineQueueRef.current.length === 0) return;

    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    setQueuedCount(0);

    (async () => {
      for (const item of queue) {
        try {
          await handleSendMessage(item.body, item.attachments, item.replyToId);
        } catch {
          // Re-queue on failure
          offlineQueueRef.current.push(item);
          setQueuedCount(offlineQueueRef.current.length);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // ─── Send message ────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (
      body: string,
      attachments?: MessageAttachment[],
      replyToId?: string
    ) => {
      stopTyping();

      // Offline: queue instead of sending
      if (
        connectionState === 'unavailable' ||
        connectionState === 'disconnected' ||
        !navigator.onLine
      ) {
        offlineQueueRef.current.push({ body, attachments, replyToId });
        setQueuedCount(offlineQueueRef.current.length);
        return;
      }
      const optimisticId = `${OPTIMISTIC_PREFIX}${Date.now()}`;
      const replyMsg = replyToId
        ? messagesRef.current.find((m) => m.uuid === replyToId)
        : undefined;
      const optimistic: Message = {
        uuid: optimisticId,
        conversation_uuid: conversationUuid,
        sender_id: user?.id ?? '',
        sender: user
          ? {
              id: user.id,
              name: `${user.firstname} ${user.lastname}`,
              avatar: user.avatar ?? null,
            }
          : null,
        type:
          attachments?.[0]?.type === 'image'
            ? 'image'
            : attachments?.length
              ? 'file'
              : 'text',
        body,
        attachments: attachments ?? null,
        reply_to: replyMsg
          ? {
              uuid: replyMsg.uuid,
              body: replyMsg.body,
              sender_id: replyMsg.sender_id,
            }
          : null,
        status: 'sending',
        read_at: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
      };

      updateCache((old) => ({
        ...old,
        messages: [...old.messages, optimistic],
      }));
      setReplyTo(null);

      // Optimistically update the conversation list so our own sent message
      // appears immediately as the last preview (Pusher never echoes back to sender).
      const updateConvList = (msg: Message | null) => {
        queryClient.setQueryData<{ data: Conversation[]; meta: unknown }>(
          ['conversations'],
          (old) => {
            if (!old) return old;
            const updated = old.data.map((c) =>
              c.uuid === conversationUuid
                ? {
                    ...c,
                    last_message: msg ?? c.last_message,
                    last_message_at: msg?.created_at ?? c.last_message_at,
                  }
                : c
            );
            if (msg) {
              updated.sort((a, b) =>
                (b.last_message_at ?? '') > (a.last_message_at ?? '') ? 1 : -1
              );
            }
            return { ...old, data: updated };
          }
        );
      };
      updateConvList(optimistic);

      try {
        const confirmed = await sendMessage(conversationUuid, {
          body,
          type: optimistic.type as 'text' | 'image' | 'file',
          reply_to_id: replyToId,
          attachments,
        });
        // Upgrade to 'delivered' immediately if recipient is currently online
        const confirmedStatus =
          onlineStatusRef.current === 'online'
            ? ('delivered' as const)
            : confirmed.status;
        const confirmedMsg = { ...confirmed, status: confirmedStatus };
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) =>
            m.uuid === optimisticId ? confirmedMsg : m
          ),
        }));
        // Replace optimistic entry with the server-confirmed message
        updateConvList(confirmedMsg);
      } catch {
        updateCache((old) => ({
          ...old,
          messages: old.messages.filter((m) => m.uuid !== optimisticId),
        }));
        // Revert the optimistic conversation-list update on failure
        updateConvList(null);
      }
    },
    [conversationUuid, user, updateCache, queryClient]
  );

  // ─── Upload file ─────────────────────────────────────────────────────────

  const handleUploadFile = useCallback(
    (file: File, onProgress?: (pct: number) => void) =>
      uploadAttachment(conversationUuid, file, onProgress),
    [conversationUuid]
  );

  // ─── Delete message ──────────────────────────────────────────────────────

  const handleDeleteMessage = useCallback(
    async (uuid: string) => {
      await deleteMessage(uuid);
      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) =>
          m.uuid === uuid
            ? { ...m, body: null, deleted_at: new Date().toISOString() }
            : m
        ),
      }));
    },
    [updateCache]
  );

  return {
    messages,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
    sendMessage: handleSendMessage,
    uploadFile: handleUploadFile,
    deleteMessage: handleDeleteMessage,
    setReplyTo,
    replyTo,
    otherIsTyping,
    onlineStatus,
    presenceDevice,
    notifyTyping,
    stopTyping,
    markAsRead,
    queuedCount,
  };
}
