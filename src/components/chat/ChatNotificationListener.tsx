'use client';

import { getEcho } from '@/lib/echo';
import {
  applyMessageSentToConversationsCache,
  applyMessagesReadToConversationsCache,
} from '@/lib/conversation-list-cache';
import type { ConversationsListQueryData } from '@/lib/conversation-list-cache';
import { selectConversationsForBackgroundWs } from '@/lib/chat-subscriptions';
import { chatKeys } from '@/lib/query-keys';
import { chatMessagesKey } from '@/hooks/useChat';
import type { MessagesCache } from '@/hooks/useChat';
import type { Message, Conversation, UnreadCountResponse } from '@/types/chat';
import { fetchConversations } from '@/lib/chat-api';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Global listener mounted in every layout when authenticated. Keeps unread
 * state, inbox previews, and message caches coherent with WebSocket delivery.
 *
 * No duplicate channels — Echo reuses the same Pusher subscription.
 * At most MAX_BACKGROUND_WS_CONVERSATIONS private channels are subscribed
 * (unread conversations first) to limit client and Reverb load.
 */
interface ChatNotificationListenerProps {
  basePath?: string;
  /** Accent colour for the toast (pink #F6475F for client, teal #0D9488 for owner). */
  accentColor?: string;
}

export function ChatNotificationListener({
  basePath = '/messages',
  accentColor = '#F6475F',
}: ChatNotificationListenerProps = {}) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const listKey = user
    ? chatKeys.conversations(user.id)
    : chatKeys.conversations('');

  const { data } = useQuery<{
    data: Conversation[];
    meta: { current_page: number; last_page: number; total: number };
  }>({
    queryKey: listKey,
    queryFn: () => fetchConversations(),
    enabled: isAuthenticated && !!user,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
  });

  const conversations: Conversation[] = data?.data ?? [];
  const subscribedConversations = useMemo(
    () => selectConversationsForBackgroundWs(conversations),
    [conversations]
  );

  // Stable dependency: sorted UUID string (rebinds when subscribed set changes)
  const convUuids = useMemo(
    () =>
      subscribedConversations
        .map((c) => c.uuid)
        .sort()
        .join(','),
    [subscribedConversations]
  );

  const syncChatCaches = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: chatKeys.allConversations,
    });
    void queryClient.invalidateQueries({ queryKey: chatKeys.allUnread });
    void queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] === 'chat-messages',
    });
  }, [queryClient]);

  // ─── WS reconnect handler ─────────────────────────────────────────────────
  // When the WebSocket reconnects after a disconnect, we may have missed
  // events. Invalidate all chat queries so TanStack refetches the latest data.
  useEffect(() => {
    if (!isAuthenticated) return;

    const pusher = getEcho().connector.pusher;
    const handler = ({
      previous,
      current,
    }: {
      previous: string;
      current: string;
    }) => {
      const wasOffline =
        previous === 'unavailable' ||
        previous === 'disconnected' ||
        previous === 'connecting';
      if (wasOffline && current === 'connected') {
        syncChatCaches();
      }
    };

    pusher.connection.bind('state_change', handler);
    return () => {
      pusher.connection.unbind('state_change', handler);
    };
  }, [isAuthenticated, queryClient, syncChatCaches]);

  // ─── Document visibility / bfcache (especially mobile PWA) ──────────────
  // iOS/Android can suspend tabs without a clean Pusher "disconnected" state.
  // After ~15s in background, refetch inbox + messages so missed WS events
  // do not stick until manual refresh. Short tab switches stay cheap (no refetch).
  useEffect(() => {
    if (!isAuthenticated) return;

    const MIN_HIDDEN_MS = 15_000;
    const hiddenAtRef = { current: null as number | null };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      const start = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (start == null) {
        return;
      }
      if (Date.now() - start < MIN_HIDDEN_MS) {
        return;
      }
      syncChatCaches();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        syncChatCaches();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [isAuthenticated, syncChatCaches]);

  // ─── Per-conversation listeners ────────────────────────────────────────────
  // Race-safe binding: echo.private(name).subscription may be momentarily
  // undefined (StrictMode, fast nav, freshly-recreated singleton). Retry
  // every 50ms (max 1s) per UUID until the underlying Pusher channel is
  // ready, then bind once. Mirrors the pattern in useChat.ts. Without this, the first render after navigation
  // can silently miss message.sent events.
  useEffect(() => {
    if (!user || !convUuids) return;

    const echo = getEcho();
    const uuids = convUuids.split(',').filter(Boolean);
    const convMap = new Map(subscribedConversations.map((c) => [c.uuid, c]));
    /**
     * Minimal Pusher channel surface we actually use here. The full Pusher
     * channel type isn't exported from `laravel-echo`, so we keep a structural
     * type rather than `any`. We bind two events per channel:
     *  - `message.sent`   → list preview / unread bump
     *  - `messages.read`  → flip own-message ticks to "read" in real time
     */
    type AnyHandler = (data: unknown) => void;
    type PusherSubscription = {
      bind: (event: string, handler: AnyHandler) => void;
      unbind: (event: string, handler?: AnyHandler) => void;
    };
    interface MessagesReadPayload {
      reader_id: string;
      read_at: string;
    }
    const bindings: Array<{
      pusherCh: PusherSubscription;
      event: string;
      handler: AnyHandler;
    }> = [];
    const retryTimers: Array<ReturnType<typeof setTimeout>> = [];
    let cancelled = false;

    const tryBindOne = (uuid: string, attempts: number = 0) => {
      if (cancelled) return;
      const channelName = `conversation.${uuid}`;
      const echoChannel = echo.private(channelName);
      const pusherCh = (
        echoChannel as unknown as { subscription?: PusherSubscription }
      ).subscription;
      if (!pusherCh) {
        if (attempts < 20) {
          retryTimers.push(
            setTimeout(() => tryBindOne(uuid, attempts + 1), 50)
          );
        }
        return;
      }

      const messageSentHandler = (raw: unknown) => {
        const event = raw as Message;
        const msgKey = chatMessagesKey(user.id, event.conversation_uuid);
        queryClient.setQueryData<MessagesCache>(msgKey, (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.uuid === event.uuid)) return old;
          return { ...old, messages: [...old.messages, event] };
        });

        queryClient.setQueryData(
          listKey,
          (old: ConversationsListQueryData | undefined) =>
            applyMessageSentToConversationsCache(old, event, user.id)
        );

        // Skip toast + aggregate unread for own messages or while viewing this thread
        if (event.sender_id === user.id) return;
        if (pathnameRef.current === `${basePath}/${uuid}`) return;

        // ── Real-time unread badge ──────────────────────────────────────────
        // Increment unread cache for this user — no re-fetch needed.
        // Both ChatBadgeIcon (client nav) and OwnerSidebar read this key.
        queryClient.setQueryData<UnreadCountResponse>(
          chatKeys.unread(user.id),
          (old) => {
            if (!old) return old;
            const hasConv = old.conversations.some((c) => c.uuid === uuid);
            return {
              total: old.total + 1,
              conversations: hasConv
                ? old.conversations.map((c) =>
                    c.uuid === uuid ? { ...c, count: c.count + 1 } : c
                  )
                : [...old.conversations, { uuid, count: 1 }],
            };
          }
        );

        const conv = convMap.get(uuid);
        const senderName = conv?.other_participant?.name ?? 'Nouveau message';
        const preview = event.is_client_sealed
          ? '🔐 Message sécurisé'
          : event.body
            ? event.body.slice(0, 55)
            : event.type === 'image'
              ? '📷 Photo'
              : '📎 Pièce jointe';

        const convUuid = uuid;

        enqueueSnackbar(`${senderName}: ${preview}`, {
          variant: 'chatMessage',
          accentColor,
          onClick: () => router.push(`${basePath}/${convUuid}`),
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          autoHideDuration: 5000,
        });
      };

      // `messages.read` flips own-message ticks to read in the inbox even
      // when the user is not currently viewing the thread. The thread page
      // (`useChat`) handles the same event for the open conversation.
      const messagesReadHandler = (raw: unknown) => {
        const event = raw as MessagesReadPayload;
        queryClient.setQueryData(
          listKey,
          (old: ConversationsListQueryData | undefined) =>
            applyMessagesReadToConversationsCache(
              old,
              uuid,
              event.reader_id,
              event.read_at,
              user.id
            )
        );
      };

      pusherCh.bind('message.sent', messageSentHandler);
      pusherCh.bind('messages.read', messagesReadHandler);
      bindings.push(
        { pusherCh, event: 'message.sent', handler: messageSentHandler },
        { pusherCh, event: 'messages.read', handler: messagesReadHandler }
      );
    };

    uuids.forEach((uuid) => tryBindOne(uuid));

    return () => {
      cancelled = true;
      retryTimers.forEach(clearTimeout);
      bindings.forEach(({ pusherCh, event, handler }) => {
        pusherCh.unbind(event, handler);
      });
    };
  }, [
    user,
    convUuids,
    listKey,
    queryClient,
    enqueueSnackbar,
    router,
    basePath,
    accentColor,
  ]);

  return null;
}
