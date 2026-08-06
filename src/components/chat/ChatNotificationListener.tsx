'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/chat/echo';
import {
  applyMessageSentToConversationsCache,
  applyMessagesReadToConversationsCache,
  applyConversationStatusToConversationsCache,
} from '@/lib/chat/conversation-list-cache';
import type { ConversationsListQueryData } from '@/lib/chat/conversation-list-cache';
import { selectConversationsForBackgroundWs } from '@/lib/chat/chat-subscriptions';
import { chatKeys } from '@/lib/query-keys';
import { chatMessagesKey } from '@/hooks/useChat';
import type { MessagesCache } from '@/hooks/useChat';
import type { Message, Conversation, UnreadCountResponse } from '@/types/chat';
import { fetchConversations } from '@/lib/chat/chat-api';
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

  const conversations = useMemo<Conversation[]>(() => data?.data ?? [], [data]);
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
    if (!isReverbRealtimeConfigured()) return;

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

  // ─── User-channel listener (`private-user.{id}`, event `message.received`) ─
  // Source UNIQUE de vérité temps réel pour : inbox list, badge non-lu
  // agrégé et toast. Couvre toutes les conversations — y compris celles au-
  // delà du cap MAX_BACKGROUND_WS et les conversations toutes neuves (le
  // backend diffuse MessageReceived sur le canal du destinataire à chaque
  // envoi). Les bindings par conversation ci-dessous ne gèrent plus que le
  // cache du fil ouvert + read receipts + archive.
  const seenMessageUuidsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    if (!isReverbRealtimeConfigured()) return;

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    const handler = (raw: unknown) => {
      const event = raw as Message & {
        sender?: { id: string; name: string; avatar: string | null } | null;
      };
      const uuid = event.conversation_uuid;
      if (!event.uuid || !uuid) return;

      // Dédup défensive (retry réseau, double livraison) — les effets
      // ci-dessous ne sont pas idempotents (incréments).
      const seen = seenMessageUuidsRef.current;
      if (seen.has(event.uuid)) return;
      seen.add(event.uuid);
      if (seen.size > 200) {
        seen.delete(seen.values().next().value as string);
      }

      // ── Inbox list ──────────────────────────────────────────────────────
      const listData =
        queryClient.getQueryData<ConversationsListQueryData>(listKey);
      const convExists = listData?.data.some((c) => c.uuid === uuid) ?? false;
      if (convExists) {
        queryClient.setQueryData(
          listKey,
          (old: ConversationsListQueryData | undefined) =>
            applyMessageSentToConversationsCache(old, event, user.id)
        );
      } else {
        // Conversation toute neuve (ou liste pas encore en cache) : refetch
        // pour récupérer la fiche complète (interlocuteur, annonce liée…).
        void queryClient.invalidateQueries({ queryKey: listKey });
      }

      // Skip toast + badge quand le fil concerné est déjà ouvert.
      if (pathnameRef.current === `${basePath}/${uuid}`) return;

      // ── Real-time unread badge ──────────────────────────────────────────
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

      // ── Toast ───────────────────────────────────────────────────────────
      const senderName = event.sender?.name ?? 'Nouveau message';
      // E2EE off by default (mai 2026) — sealed previews are now only seen for
      // legacy messages emitted from devices that still hold a private key.
      const preview = event.is_client_sealed
        ? 'Message d’un ancien appareil'
        : event.body
          ? event.body.slice(0, 55)
          : event.type === 'image'
            ? '📷 Photo'
            : '📎 Pièce jointe';

      enqueueSnackbar(`${senderName}: ${preview}`, {
        variant: 'chatMessage',
        accentColor,
        onClick: () => router.push(`${basePath}/${uuid}`),
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        autoHideDuration: 5000,
      });
    };

    channel.listen('.message.received', handler);

    return () => {
      // stopListening (et non leave) : le canal `user.{id}` est partagé avec
      // CreditsRealtimeListener (`.credits.updated`) — ne pas le couper.
      channel.stopListening('.message.received', handler);
    };
  }, [
    user,
    isAuthenticated,
    listKey,
    queryClient,
    enqueueSnackbar,
    router,
    basePath,
    accentColor,
  ]);

  // ─── Per-conversation listeners ────────────────────────────────────────────
  // Race-safe binding: echo.private(name).subscription may be momentarily
  // undefined (StrictMode, fast nav, freshly-recreated singleton). Retry
  // every 50ms (max 1s) per UUID until the underlying Pusher channel is
  // ready, then bind once. Mirrors the pattern in useChat.ts. Without this, the first render after navigation
  // can silently miss message.sent events.
  useEffect(() => {
    if (!user || !convUuids) return;
    if (!isReverbRealtimeConfigured()) return;

    const echo = getEcho();
    const uuids = convUuids.split(',').filter(Boolean);
    /**
     * Minimal Pusher channel surface we actually use here. The full Pusher
     * channel type isn't exported from `laravel-echo`, so we keep a structural
     * type rather than `any`. We bind these events per channel:
     *  - `message.sent`   → append au cache du fil (idempotent, dédup uuid)
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
    interface ConversationArchivedPayload {
      conversation_uuid: string;
      archived_by_id: string;
    }
    interface ConversationUnarchivedPayload {
      conversation_uuid: string;
      unarchived_by_id: string;
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
        // Inbox list, unread badge et toast sont gérés par l'abonnement au
        // canal utilisateur (`message.received`) ci-dessous — source unique
        // qui couvre AUSSI les conversations non souscrites ici (cap
        // MAX_BACKGROUND_WS) et les conversations toutes neuves. Doubler
        // ces effets ici compterait les non-lus en double.
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

      const conversationArchivedHandler = (raw: unknown) => {
        const event = raw as ConversationArchivedPayload;
        if (event.conversation_uuid !== uuid) {
          return;
        }
        queryClient.setQueryData(
          listKey,
          (old: ConversationsListQueryData | undefined) =>
            applyConversationStatusToConversationsCache(old, uuid, 'archived')
        );
      };

      const conversationUnarchivedHandler = (raw: unknown) => {
        const event = raw as ConversationUnarchivedPayload;
        if (event.conversation_uuid !== uuid) {
          return;
        }
        queryClient.setQueryData(
          listKey,
          (old: ConversationsListQueryData | undefined) =>
            applyConversationStatusToConversationsCache(old, uuid, 'active')
        );
      };

      pusherCh.bind('message.sent', messageSentHandler);
      pusherCh.bind('messages.read', messagesReadHandler);
      pusherCh.bind('conversation.archived', conversationArchivedHandler);
      pusherCh.bind('conversation.unarchived', conversationUnarchivedHandler);
      bindings.push(
        { pusherCh, event: 'message.sent', handler: messageSentHandler },
        { pusherCh, event: 'messages.read', handler: messagesReadHandler },
        {
          pusherCh,
          event: 'conversation.archived',
          handler: conversationArchivedHandler,
        },
        {
          pusherCh,
          event: 'conversation.unarchived',
          handler: conversationUnarchivedHandler,
        }
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
