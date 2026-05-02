'use client';

import { getEcho } from '@/lib/echo';
import { selectConversationsForBackgroundWs } from '@/lib/chat-subscriptions';
import { chatKeys } from '@/lib/query-keys';
import { chatMessagesKey } from '@/hooks/useChat';
import type { MessagesCache } from '@/hooks/useChat';
import type { Message, Conversation, UnreadCountResponse } from '@/types/chat';
import { fetchConversations } from '@/lib/chat-api';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Global listener mounted in every layout. Three responsibilities:
 *
 * 1. **Toast notifications** — shows a branded snackbar for new messages when
 *    the user is NOT viewing that conversation. The toast colour is panel-aware
 *    via the `accentColor` prop (pink for client, teal for owner).
 * 2. **Global message cache sync** — pushes incoming messages into the per-
 *    conversation TanStack messages cache so data is already there when the
 *    user opens the conversation.
 * 3. **Reconnect invalidation** — when the WebSocket reconnects after a drop,
 *    invalidates all chat-related queries so stale caches are refreshed.
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
    staleTime: Infinity,
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
        void queryClient.invalidateQueries({
          queryKey: chatKeys.allConversations,
        });
        void queryClient.invalidateQueries({ queryKey: chatKeys.allUnread });
        // Invalidate all active message caches
        void queryClient.invalidateQueries({
          predicate: (q) => q.queryKey[0] === 'chat-messages',
        });
      }
    };

    pusher.connection.bind('state_change', handler);
    return () => {
      pusher.connection.unbind('state_change', handler);
    };
  }, [isAuthenticated, queryClient]);

  // ─── Per-conversation listeners ────────────────────────────────────────────
  // Race-safe binding: echo.private(name).subscription may be momentarily
  // undefined (StrictMode, fast nav, freshly-recreated singleton). Retry
  // every 50ms (max 1s) per UUID until the underlying Pusher channel is
  // ready, then bind once. Mirrors the pattern in useChat.ts and
  // useConversations.ts. Without this, the first render after navigation
  // can silently miss message.sent events.
  useEffect(() => {
    if (!user || !convUuids) return;

    const echo = getEcho();
    const uuids = convUuids.split(',').filter(Boolean);
    const convMap = new Map(subscribedConversations.map((c) => [c.uuid, c]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: Array<{
      pusherCh: any;
      handler: (event: Message) => void;
    }> = [];
    const retryTimers: Array<ReturnType<typeof setTimeout>> = [];
    let cancelled = false;

    const tryBindOne = (uuid: string, attempts: number = 0) => {
      if (cancelled) return;
      const channelName = `conversation.${uuid}`;
      const echoChannel = echo.private(channelName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pusherCh = (echoChannel as any).subscription;
      if (!pusherCh) {
        if (attempts < 20) {
          retryTimers.push(
            setTimeout(() => tryBindOne(uuid, attempts + 1), 50)
          );
        }
        return;
      }

      const handler = (event: Message) => {
        // Global message cache sync — push into per-conversation cache
        const msgKey = chatMessagesKey(user.id, event.conversation_uuid);
        queryClient.setQueryData<MessagesCache>(msgKey, (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.uuid === event.uuid)) return old;
          return { ...old, messages: [...old.messages, event] };
        });

        // Skip everything else for own messages or while actively viewing the conversation
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

      pusherCh.bind('message.sent', handler);
      bindings.push({ pusherCh, handler });
    };

    uuids.forEach((uuid) => tryBindOne(uuid));

    return () => {
      cancelled = true;
      retryTimers.forEach(clearTimeout);
      bindings.forEach(({ pusherCh, handler }) => {
        pusherCh.unbind('message.sent', handler);
      });
    };
  }, [
    user,
    convUuids,
    queryClient,
    enqueueSnackbar,
    router,
    basePath,
    accentColor,
  ]);

  return null;
}
