'use client';

import { getEcho } from '@/lib/echo';
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

  const { data } = useQuery<{
    data: Conversation[];
    meta: { current_page: number; last_page: number; total: number };
  }>({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(),
    enabled: isAuthenticated,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const conversations: Conversation[] = data?.data ?? [];

  // Stable dependency: sorted UUID string (rebinds when conversation set changes)
  const convUuids = useMemo(
    () =>
      conversations
        .map((c) => c.uuid)
        .sort()
        .join(','),
    [conversations]
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
        void queryClient.invalidateQueries({ queryKey: ['conversations'] });
        void queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
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
  useEffect(() => {
    if (!user || !convUuids) return;

    const echo = getEcho();
    const uuids = convUuids.split(',');
    const convMap = new Map(conversations.map((c) => [c.uuid, c]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bindings: Array<{
      pusherCh: any;
      handler: (event: Message) => void;
    }> = [];

    uuids.forEach((uuid) => {
      const channelName = `conversation.${uuid}`;
      const echoChannel = echo.private(channelName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pusherCh = (echoChannel as any).subscription;
      if (!pusherCh) return;

      const handler = (event: Message) => {
        // Global message cache sync — push into per-conversation cache
        const msgKey = chatMessagesKey(event.conversation_uuid);
        queryClient.setQueryData<MessagesCache>(msgKey, (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.uuid === event.uuid)) return old;
          return { ...old, messages: [...old.messages, event] };
        });

        // Skip everything else for own messages or while actively viewing the conversation
        if (event.sender_id === user.id) return;
        if (pathnameRef.current === `${basePath}/${uuid}`) return;

        // ── Real-time unread badge ──────────────────────────────────────────
        // Increment ['chat-unread'] directly — no re-fetch needed.
        // Both ChatBadgeIcon (client nav) and OwnerSidebar read this key.
        queryClient.setQueryData<UnreadCountResponse>(
          ['chat-unread'],
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
        const preview = event.body
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
    });

    return () => {
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
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
