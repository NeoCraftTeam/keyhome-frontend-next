'use client';

import {
  addReaction,
  deleteMessage,
  fetchMessages,
  markConversationAsRead,
  removeReaction,
  sendMessage,
  uploadAttachment,
  type SendMessageInput,
} from '@/lib/chat-api';
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  createConversationAesKey,
  exportAesRawKey,
  getChatE2eePrivateKey,
  importRsaPublicKeyFromPem,
  rsaOaepUnwrap,
  rsaOaepWrap,
} from '@/lib/chat-e2ee-crypto';
import { CHAT_E2EE_READY_EVENT } from '@/lib/chat-e2ee-identity';
import { enrichReplyToQuotes } from '@/lib/chat-reply-enrich';
import type { ConversationsListQueryData } from '@/lib/conversation-list-cache';
import { applyConversationStatusToConversationsCache } from '@/lib/conversation-list-cache';
import {
  getEcho,
  isReverbRealtimeConfigured,
  useEchoConnectionState,
} from '@/lib/echo';
import { chatKeys } from '@/lib/query-keys';
import { useAuth } from '@/providers/AuthProvider';
import type {
  Conversation,
  Message,
  MessageAttachment,
  TypingEvent,
  UnreadCountResponse,
  VoiceRecordingEvent,
} from '@/types/chat';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DeviceType } from './usePresence';
import { usePresence } from './usePresence';
import {
  TYPING_RECEIVER_FALLBACK_MS,
  useTypingIndicator,
} from './useTypingIndicator';

/** Safety clear if is_recording false whisper is lost — matches VoiceRecorder max + margin. */
const VOICE_RECORDING_RECEIVER_FALLBACK_MS = 125_000;

type QueuedMessage = {
  body: string;
  attachments?: MessageAttachment[];
  replyToId?: string;
  /** When queued offline, send via server-side encryption (no E2EE wrap on replay). */
  skipE2ee?: boolean;
};

const OPTIMISTIC_PREFIX = '__optimistic__';

function convSessionAesMapKey(
  userId: string,
  conversationUuid: string
): string {
  return `${userId}:${conversationUuid}`;
}

async function buildSealedMessagePayload(
  conv: Conversation,
  conversationUuid: string,
  plaintext: string,
  convAesKeyRef: { current: Map<string, CryptoKey> },
  userId: string
): Promise<SendMessageInput> {
  const e2ee = conv.e2ee;
  if (!e2ee?.tenant_public_key_pem || !e2ee.landlord_public_key_pem) {
    throw new Error('E2EE keys missing');
  }

  const sessionKey = convSessionAesMapKey(userId, conversationUuid);
  const cachedAes = convAesKeyRef.current.get(sessionKey) ?? null;
  if (cachedAes) {
    const { ciphertextB64, ivB64 } = await aesGcmEncrypt(cachedAes, plaintext);
    return {
      is_client_sealed: true,
      e2ee_ciphertext_b64: ciphertextB64,
      e2ee_iv_b64: ivB64,
    };
  }

  if (e2ee.session_ready && e2ee.wrapped_conversation_key_b64) {
    const priv = await getChatE2eePrivateKey(userId);
    if (!priv) {
      throw new Error('No local E2EE private key');
    }
    const aesKey = await rsaOaepUnwrap(priv, e2ee.wrapped_conversation_key_b64);
    convAesKeyRef.current.set(sessionKey, aesKey);
    const { ciphertextB64, ivB64 } = await aesGcmEncrypt(aesKey, plaintext);
    return {
      is_client_sealed: true,
      e2ee_ciphertext_b64: ciphertextB64,
      e2ee_iv_b64: ivB64,
    };
  }

  const aesKey = await createConversationAesKey();
  convAesKeyRef.current.set(sessionKey, aesKey);
  const raw = await exportAesRawKey(aesKey);
  const tenantPub = await importRsaPublicKeyFromPem(e2ee.tenant_public_key_pem);
  const landlordPub = await importRsaPublicKeyFromPem(
    e2ee.landlord_public_key_pem
  );
  const wrappedTenant = await rsaOaepWrap(tenantPub, raw);
  const wrappedLandlord = await rsaOaepWrap(landlordPub, raw);
  const enc = await aesGcmEncrypt(aesKey, plaintext);
  return {
    is_client_sealed: true,
    e2ee_ciphertext_b64: enc.ciphertextB64,
    e2ee_iv_b64: enc.ivB64,
    e2ee_wrapped_keys: { tenant: wrappedTenant, landlord: wrappedLandlord },
  };
}

/**
 * TanStack stale window below server `chat.signed_url_ttl_hours` (default 24)
 * so window-focus refetch renews attachment signed URLs before expiry.
 */
export const CHAT_MESSAGES_STALE_MS = 23 * 60 * 60 * 1000;

/**
 * Per-user + conversation — same pattern as {@link chatKeys.conversations}.
 * Avoids TanStack cache bleed when switching accounts on one browser profile.
 */
export const chatMessagesKey = (userId: string, conversationUuid: string) =>
  ['chat-messages', userId, conversationUuid] as const;

/**
 * Prefetch messages for a conversation into the TanStack cache.
 * Call on hover/touch of a ConversationItem so data is ready when the user taps.
 */
export function prefetchChatMessages(
  queryClient: QueryClient,
  userId: string,
  conversationUuid: string
) {
  if (!userId) {
    return;
  }
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
  otherParticipantId: string,
  conversation?: Conversation | null
): {
  messages: Message[];
  isLoading: boolean;
  isFetching: boolean;
  isMessagesError: boolean;
  refetchMessages: () => void;
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
  toggleReaction: (messageUuid: string, emoji: string) => Promise<void>;
  setReplyTo: (message: Message | null) => void;
  replyTo: Message | null;
  otherIsTyping: boolean;
  onlineStatus: 'online' | 'offline' | 'unknown';
  presenceDevice: DeviceType;
  notifyTyping: () => void;
  stopTyping: () => void;
  setVoiceRecordingActive: (active: boolean) => void;
  otherIsRecordingVoice: boolean;
  markAsRead: () => void;
  /** Number of messages queued while offline — flushes automatically on reconnect. */
  queuedCount: number;
} {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [e2eeBootstrapTick, setE2eeBootstrapTick] = useState(0);

  useEffect(() => {
    const onReady = (): void => {
      setE2eeBootstrapTick((n) => n + 1);
    };
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener(CHAT_E2EE_READY_EVENT, onReady);
    return () => window.removeEventListener(CHAT_E2EE_READY_EVENT, onReady);
  }, []);

  const queryClient = useQueryClient();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [otherIsRecordingVoice, setOtherIsRecordingVoice] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const offlineQueueRef = useRef<QueuedMessage[]>([]);
  const connectionState = useEchoConnectionState();
  const convAesKeyRef = useRef<Map<string, CryptoKey>>(new Map());
  const decryptedIdsRef = useRef<Set<string>>(new Set());
  const prevConversationUuidRef = useRef<string | null>(null);
  const prevUserIdForConvKeyRef = useRef<string>('');

  useEffect(() => {
    const uid = userId;
    if (
      prevUserIdForConvKeyRef.current !== '' &&
      prevUserIdForConvKeyRef.current !== uid
    ) {
      convAesKeyRef.current.clear();
      decryptedIdsRef.current.clear();
    }
    prevUserIdForConvKeyRef.current = uid;

    if (!uid) {
      prevConversationUuidRef.current = conversationUuid;
      return;
    }
    if (
      prevConversationUuidRef.current !== null &&
      prevConversationUuidRef.current !== conversationUuid
    ) {
      convAesKeyRef.current.delete(
        convSessionAesMapKey(uid, prevConversationUuidRef.current)
      );
      decryptedIdsRef.current.clear();
    }
    prevConversationUuidRef.current = conversationUuid;
  }, [conversationUuid, userId]);

  const conversationRef = useRef(conversation ?? null);

  useEffect(() => {
    conversationRef.current = conversation ?? null;
  }, [conversation]);

  const { notifyTyping, stopTyping, setVoiceRecordingActive } =
    useTypingIndicator(conversationUuid);
  const { status: onlineStatus, device: presenceDevice } =
    usePresence(otherParticipantId);

  const isLoadingMoreRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRecTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs so handleSendMessage closure always reads the latest values without
  // stale capture, and without re-creating the callback on every state change
  // (which would trigger MessageInput re-renders for nothing).
  const onlineStatusRef = useRef(onlineStatus);
  const connectionStateRef = useRef(connectionState);
  const stopTypingRef = useRef(stopTyping);
  useEffect(() => {
    onlineStatusRef.current = onlineStatus;
  }, [onlineStatus]);
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  }, [stopTyping]);

  // ─── TanStack Query: message fetch + cache ────────────────────────────────
  // Real-time: WS merges new rows. staleTime just under signed URL TTL so
  // refetchOnWindowFocus renews R2 links; refetch merges older loaded pages.
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

  // Helper: update the React Query cache directly
  const updateCache = useCallback(
    (updater: (old: MessagesCache) => MessagesCache) => {
      queryClient.setQueryData<MessagesCache>(
        chatMessagesKey(userId, conversationUuid),
        (old) => updater(old ?? { messages: [], hasMore: false, cursor: null })
      );
    },
    [queryClient, userId, conversationUuid]
  );

  // API leaves `reply_to.body` null for E2EE parents; once the parent row is
  // decrypted client-side, fill the quote so replies don't show a false
  // "Message sécurisé" preview.
  useEffect(() => {
    const list = data?.messages;
    if (!userId || !conversationUuid || !list?.length) {
      return;
    }
    updateCache((old) => {
      const nextMsgs = enrichReplyToQuotes(old.messages);
      if (nextMsgs === old.messages) {
        return old;
      }

      return { ...old, messages: nextMsgs };
    });
  }, [conversationUuid, data?.messages, updateCache, userId]);

  // Decryption pass — runs whenever the message list or the conversation's
  // wrapped session key changes. Tries to decrypt every sealed message that
  // is missing `decrypted_body`. If we can't unwrap (no local private key) or
  // can't decrypt a specific message, mark it as `decryption_failed` so the
  // bubble can render a clear "key unavailable" fallback instead of staying
  // stuck on "Déchiffrement…" forever.
  useEffect(() => {
    const conv = conversationRef.current;
    const e2ee = conv?.e2ee;
    if (
      !userId ||
      !e2ee?.session_ready ||
      !e2ee.wrapped_conversation_key_b64 ||
      typeof crypto === 'undefined' ||
      !crypto.subtle
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const wrappedB64 = e2ee.wrapped_conversation_key_b64;
      if (!wrappedB64) {
        return;
      }

      const mapKey = convSessionAesMapKey(userId, conversationUuid);
      let aesKey = convAesKeyRef.current.get(mapKey) ?? null;
      if (!aesKey) {
        const priv = await getChatE2eePrivateKey(userId);
        if (cancelled) {
          return;
        }
        if (!priv) {
          return;
        }
        try {
          aesKey = await rsaOaepUnwrap(priv, wrappedB64);
        } catch {
          updateCache((old) => ({
            ...old,
            messages: old.messages.map((x) =>
              x.is_client_sealed &&
              (x.decrypted_body == null || x.decrypted_body === '')
                ? { ...x, decryption_failed: true }
                : x
            ),
          }));
          return;
        }
        convAesKeyRef.current.set(mapKey, aesKey);
      }

      for (const m of messages) {
        if (cancelled) return;
        if (!m.is_client_sealed || !m.e2ee) continue;
        if (decryptedIdsRef.current.has(m.uuid)) continue;
        if (m.decrypted_body != null && m.decrypted_body !== '') {
          decryptedIdsRef.current.add(m.uuid);
          continue;
        }
        try {
          const plain = await aesGcmDecrypt(
            aesKey,
            m.e2ee.ciphertext_b64,
            m.e2ee.iv_b64
          );
          if (cancelled) return;
          decryptedIdsRef.current.add(m.uuid);
          updateCache((old) => ({
            ...old,
            messages: old.messages.map((x) =>
              x.uuid === m.uuid
                ? { ...x, decrypted_body: plain, decryption_failed: false }
                : x
            ),
          }));
        } catch {
          if (cancelled) return;
          updateCache((old) => ({
            ...old,
            messages: old.messages.map((x) =>
              x.uuid === m.uuid ? { ...x, decryption_failed: true } : x
            ),
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    conversationUuid,
    conversation?.e2ee?.session_ready,
    conversation?.e2ee?.wrapped_conversation_key_b64,
    messages,
    updateCache,
    userId,
    e2eeBootstrapTick,
  ]);

  // ─── Load older messages ─────────────────────────────────────────────────

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

  // ─── Mark as read ────────────────────────────────────────────────────────

  const markAsRead = useCallback(() => {
    if (!user) {
      return;
    }
    const userId = user.id;
    void markConversationAsRead(conversationUuid)
      .then(() => {
        // Reset this conversation's unread_count in the conversations list cache
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

  // Auto mark-as-read on focus AND on Page Visibility API "visible" change.
  // The visibility API matters for PWAs returning from background and for
  // tab switches that don't fire "focus" (e.g. user re-focuses an already-
  // active window via OS app switcher).
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

  // Upgrade own sent messages → delivered when recipient comes online.
  // Mirror the upgrade onto the conversation list cache so the inbox tick
  // flips at the same moment as the bubble tick.
  useEffect(() => {
    if (onlineStatus !== 'online') return;
    if (!user?.id) return;
    updateCache((old) => ({
      ...old,
      messages: old.messages.map((m) =>
        m.sender_id === user.id && m.status === 'sent'
          ? { ...m, status: 'delivered' as const }
          : m
      ),
    }));
    queryClient.setQueryData<{ data: Conversation[]; meta: unknown }>(
      chatKeys.conversations(user.id),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((c) => {
            if (c.uuid !== conversationUuid) return c;
            const last = c.last_message;
            if (!last || last.sender_id !== user.id || last.status !== 'sent') {
              return c;
            }
            return {
              ...c,
              last_message: { ...last, status: 'delivered' as const },
            };
          }),
        };
      }
    );
  }, [onlineStatus, user?.id, updateCache, queryClient, conversationUuid]);

  // ─── WebSocket subscriptions ─────────────────────────────────────────────
  // Uses direct Pusher bind/unbind so cleanup doesn't call echo.leave(),
  // which would destroy subscriptions shared with ChatNotificationListener
  // and useConversations on the same conversation channel.

  useEffect(() => {
    if (!isReverbRealtimeConfigured()) {
      return;
    }

    const echo = getEcho();
    const echoChannel = echo.private(`conversation.${conversationUuid}`);

    const onMessageSent = (event: Message) => {
      if (event.sender_id === otherParticipantId) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setOtherIsTyping(false);
        if (voiceRecTimeoutRef.current) {
          clearTimeout(voiceRecTimeoutRef.current);
          voiceRecTimeoutRef.current = null;
        }
        setOtherIsRecordingVoice(false);
      }
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

    const onReactionAdded = (event: {
      message_uuid: string;
      user_id: string;
      emoji: string;
    }) => {
      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) => {
          if (m.uuid !== event.message_uuid) return m;
          const groups = [...(m.reactions ?? [])];
          const idx = groups.findIndex((g) => g.emoji === event.emoji);
          if (idx >= 0) {
            const group = groups[idx];
            if (group.user_ids.includes(event.user_id)) return m;
            groups[idx] = {
              ...group,
              count: group.count + 1,
              user_ids: [...group.user_ids, event.user_id],
            };
          } else {
            groups.push({
              emoji: event.emoji,
              count: 1,
              user_ids: [event.user_id],
            });
          }
          return { ...m, reactions: groups };
        }),
      }));
    };

    const onReactionRemoved = (event: {
      message_uuid: string;
      user_id: string;
      emoji: string;
    }) => {
      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) => {
          if (m.uuid !== event.message_uuid) return m;
          const groups = (m.reactions ?? [])
            .map((g) => {
              if (g.emoji !== event.emoji) return g;
              const userIds = g.user_ids.filter((id) => id !== event.user_id);
              return userIds.length === 0
                ? null
                : { ...g, count: userIds.length, user_ids: userIds };
            })
            .filter((g): g is NonNullable<typeof g> => g !== null);
          return { ...m, reactions: groups };
        }),
      }));
    };

    const onUserTyping = (event: TypingEvent) => {
      if (event.user_id === otherParticipantId) {
        setOtherIsTyping(event.is_typing);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (event.is_typing) {
          typingTimeoutRef.current = setTimeout(
            () => setOtherIsTyping(false),
            TYPING_RECEIVER_FALLBACK_MS
          );
        }
      }
    };

    const onVoiceRecording = (event: VoiceRecordingEvent) => {
      if (event.user_id === otherParticipantId) {
        setOtherIsRecordingVoice(event.is_recording);
        if (voiceRecTimeoutRef.current) {
          clearTimeout(voiceRecTimeoutRef.current);
          voiceRecTimeoutRef.current = null;
        }
        if (event.is_recording) {
          voiceRecTimeoutRef.current = setTimeout(() => {
            setOtherIsRecordingVoice(false);
            voiceRecTimeoutRef.current = null;
          }, VOICE_RECORDING_RECEIVER_FALLBACK_MS);
        }
      }
    };

    const onConversationArchived = (raw: unknown) => {
      const e = raw as { conversation_uuid: string };
      if (e.conversation_uuid !== conversationUuid) {
        return;
      }
      queryClient.setQueryData<Conversation | undefined>(
        ['conversation-single', conversationUuid],
        (old) => (old ? { ...old, status: 'archived' } : old)
      );
      if (userId) {
        queryClient.setQueryData(
          chatKeys.conversations(userId),
          (old: ConversationsListQueryData | undefined) =>
            applyConversationStatusToConversationsCache(
              old,
              conversationUuid,
              'archived'
            )
        );
      }
    };

    const onConversationUnarchived = (raw: unknown) => {
      const e = raw as { conversation_uuid: string };
      if (e.conversation_uuid !== conversationUuid) {
        return;
      }
      queryClient.setQueryData<Conversation | undefined>(
        ['conversation-single', conversationUuid],
        (old) => (old ? { ...old, status: 'active' } : old)
      );
      if (userId) {
        queryClient.setQueryData(
          chatKeys.conversations(userId),
          (old: ConversationsListQueryData | undefined) =>
            applyConversationStatusToConversationsCache(
              old,
              conversationUuid,
              'active'
            )
        );
      }
    };

    const handlers: Array<[string, (e: never) => void]> = [
      ['message.sent', onMessageSent as (e: never) => void],
      ['messages.read', onMessagesRead as (e: never) => void],
      ['message.deleted', onMessageDeleted as (e: never) => void],
      ['message.reaction.added', onReactionAdded as (e: never) => void],
      ['message.reaction.removed', onReactionRemoved as (e: never) => void],
      ['client-typing', onUserTyping as (e: never) => void],
      ['client-voice_recording', onVoiceRecording as (e: never) => void],
      ['conversation.archived', onConversationArchived as (e: never) => void],
      [
        'conversation.unarchived',
        onConversationUnarchived as (e: never) => void,
      ],
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
          if (process.env.NODE_ENV === 'development') {
            console.info(
              '%c[useChat] ✓ subscribed to conversation.' + conversationUuid,
              'color:#10b981;font-weight:bold'
            );
          }
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
        if (process.env.NODE_ENV === 'development') {
          console.debug(
            '[useChat] Bound handlers for conversation.' + conversationUuid
          );
        }
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
      if (voiceRecTimeoutRef.current) clearTimeout(voiceRecTimeoutRef.current);
    };
  }, [
    conversationUuid,
    otherParticipantId,
    user?.id,
    userId,
    queryClient,
    markAsRead,
    updateCache,
  ]);

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
          await handleSendMessage(
            item.body,
            item.attachments,
            item.replyToId,
            item.skipE2ee === true
          );
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
      replyToId?: string,
      // E2EE disabled by default (mai 2026) — kept in the public signature so
      // the offline queue can still tag entries (`item.skipE2ee = true`) and
      // so re-enabling the sealed branch is a no-op for callers.
      // eslint-disable-next-line unused-imports/no-unused-vars
      skipE2ee?: boolean
    ) => {
      stopTypingRef.current();

      // Offline: queue instead of sending. Read the LATEST connection state
      // via a ref so this callback doesn't have to be re-created when the
      // connection drops/reconnects (which would re-render MessageInput).
      const currentConnection = connectionStateRef.current;
      if (
        currentConnection === 'unavailable' ||
        currentConnection === 'disconnected' ||
        !navigator.onLine
      ) {
        offlineQueueRef.current.push({
          body,
          attachments,
          replyToId,
          skipE2ee: true,
        });
        setQueuedCount(offlineQueueRef.current.length);
        return;
      }
      if (!user) {
        return;
      }
      const optimisticId = `${OPTIMISTIC_PREFIX}${Date.now()}`;
      const replyMsg = replyToId
        ? messagesRef.current.find((m) => m.uuid === replyToId)
        : undefined;

      const conv = conversationRef.current;
      const e2eeMeta = conv?.e2ee;
      // E2EE désactivé par défaut — chiffrement serveur uniquement pour
      // portabilité cross-device (Mai 2026). La logique sealed reste en place
      // pour réactivation future si l'on adopte un flow de clé portable
      // (RSA chiffrée serveur par passphrase utilisateur — pattern Signal Desktop).
      //
      // Pour réactiver : remplacer `const wantsE2ee = false;` par la condition
      // d'origine conservée ci-dessous, et basculer `chat.client_sealed_enabled`
      // à `true` côté backend.
      //
      //   const wantsE2ee =
      //     skipE2ee !== true &&
      //     !attachments?.length &&
      //     body.trim() !== '' &&
      //     e2eeMeta?.both_keys_registered === true &&
      //     Boolean(e2eeMeta.tenant_public_key_pem) &&
      //     Boolean(e2eeMeta.landlord_public_key_pem) &&
      //     typeof crypto !== 'undefined' &&
      //     Boolean(crypto.subtle);
      void e2eeMeta;
      const wantsE2ee = false as const;

      const replyToPayload = replyMsg
        ? {
            uuid: replyMsg.uuid,
            body:
              replyMsg.decrypted_body ??
              replyMsg.body ??
              // Sealed reply parent we can't decrypt locally (legacy device).
              // Server-side encryption is now the default — see the matching
              // copy in MessageBubble's reply quote and ReplyPreview.
              (replyMsg.is_client_sealed
                ? 'Message d’un ancien appareil'
                : null),
            sender_id: replyMsg.sender_id,
            is_client_sealed: replyMsg.is_client_sealed,
          }
        : null;

      const optimistic: Message = wantsE2ee
        ? {
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
            type: 'text',
            body: null,
            is_client_sealed: true,
            decrypted_body: body,
            e2ee: null,
            attachments: null,
            reply_to: replyToPayload,
            status: 'sending',
            read_at: null,
            created_at: new Date().toISOString(),
            deleted_at: null,
          }
        : {
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
                : attachments?.[0]?.type === 'audio'
                  ? 'audio'
                  : attachments?.length
                    ? 'file'
                    : 'text',
            body,
            attachments: attachments ?? null,
            reply_to: replyToPayload,
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
          chatKeys.conversations(user.id),
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

      // Helper for the sealed-then-fall-back-to-server-encrypted flow.
      const sendSealed = async (): Promise<Message> => {
        const payload = await buildSealedMessagePayload(
          conv as Conversation,
          conversationUuid,
          body,
          convAesKeyRef,
          userId
        );
        const withReply: SendMessageInput =
          replyToId !== undefined
            ? { ...payload, reply_to_id: replyToId }
            : payload;
        return sendMessage(conversationUuid, withReply);
      };

      const sendPlaintext = (): Promise<Message> =>
        sendMessage(conversationUuid, {
          body,
          type: optimistic.type as 'text' | 'image' | 'file' | 'audio',
          reply_to_id: replyToId,
          attachments,
        });

      try {
        let confirmed: Message;
        let confirmedAsSealed = wantsE2ee;

        if (wantsE2ee && conv) {
          try {
            confirmed = await sendSealed();
            void queryClient.invalidateQueries({
              queryKey: chatKeys.allConversations,
            });
            void queryClient.invalidateQueries({
              queryKey: ['conversation-single', conversationUuid],
            });
          } catch (err) {
            // E2EE wrap or peer key issues should not lose the message.
            // Fall back to server-encrypted send so the user can keep chatting,
            // even if the local key cache is stale or the peer hasn't bootstrapped.
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '[useChat] sealed send failed, falling back to server-encrypted',
                err
              );
            }
            confirmedAsSealed = false;
            confirmed = await sendPlaintext();
          }
        } else {
          confirmed = await sendPlaintext();
        }

        // Upgrade to 'delivered' immediately if recipient is currently online
        const confirmedStatus =
          onlineStatusRef.current === 'online'
            ? ('delivered' as const)
            : confirmed.status;
        const confirmedMsg: Message = {
          ...confirmed,
          status: confirmedStatus,
          ...(confirmedAsSealed ? { decrypted_body: body } : {}),
        };
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) =>
            m.uuid === optimisticId ? confirmedMsg : m
          ),
        }));
        // Replace optimistic entry with the server-confirmed message
        updateConvList(confirmedMsg);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[useChat] send failed', err);
        }
        updateCache((old) => ({
          ...old,
          messages: old.messages.filter((m) => m.uuid !== optimisticId),
        }));
        // Revert the optimistic conversation-list update on failure
        updateConvList(null);
        // Re-throw so MessageInput can restore the textarea contents and
        // the user knows the send didn't go through.
        throw err;
      }
    },
    [conversationUuid, user, userId, updateCache, queryClient]
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

  // ─── Toggle reaction ─────────────────────────────────────────────────────
  // Optimistic: mutate the cache immediately, then either POST (add) or
  // DELETE (remove) and rollback on failure. The backend is idempotent so a
  // duplicate POST is harmless.
  const handleToggleReaction = useCallback(
    async (messageUuid: string, emoji: string) => {
      if (!user) return;
      const userId = user.id;
      let wasSelected = false;

      updateCache((old) => ({
        ...old,
        messages: old.messages.map((m) => {
          if (m.uuid !== messageUuid) return m;
          const groups = [...(m.reactions ?? [])];
          const idx = groups.findIndex((g) => g.emoji === emoji);
          if (idx >= 0 && groups[idx].user_ids.includes(userId)) {
            wasSelected = true;
            const group = groups[idx];
            const userIds = group.user_ids.filter((id) => id !== userId);
            if (userIds.length === 0) {
              groups.splice(idx, 1);
            } else {
              groups[idx] = {
                ...group,
                count: userIds.length,
                user_ids: userIds,
              };
            }
          } else if (idx >= 0) {
            groups[idx] = {
              ...groups[idx],
              count: groups[idx].count + 1,
              user_ids: [...groups[idx].user_ids, userId],
            };
          } else {
            groups.push({ emoji, count: 1, user_ids: [userId] });
          }
          return { ...m, reactions: groups };
        }),
      }));

      try {
        if (wasSelected) {
          await removeReaction(messageUuid, emoji);
        } else {
          await addReaction(messageUuid, emoji);
        }
      } catch {
        // Rollback: re-toggle the same emoji to undo our optimistic write.
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) => {
            if (m.uuid !== messageUuid) return m;
            const groups = [...(m.reactions ?? [])];
            const idx = groups.findIndex((g) => g.emoji === emoji);
            if (idx >= 0 && groups[idx].user_ids.includes(userId)) {
              const group = groups[idx];
              const userIds = group.user_ids.filter((id) => id !== userId);
              if (userIds.length === 0) groups.splice(idx, 1);
              else
                groups[idx] = {
                  ...group,
                  count: userIds.length,
                  user_ids: userIds,
                };
            } else if (idx >= 0) {
              groups[idx] = {
                ...groups[idx],
                count: groups[idx].count + 1,
                user_ids: [...groups[idx].user_ids, userId],
              };
            } else {
              groups.push({ emoji, count: 1, user_ids: [userId] });
            }
            return { ...m, reactions: groups };
          }),
        }));
      }
    },
    [user, updateCache]
  );

  return {
    messages,
    isLoading,
    isFetching,
    isMessagesError: isError,
    refetchMessages: () => {
      void refetch();
    },
    hasMore,
    loadMore,
    sendMessage: handleSendMessage,
    uploadFile: handleUploadFile,
    deleteMessage: handleDeleteMessage,
    toggleReaction: handleToggleReaction,
    setReplyTo,
    replyTo,
    otherIsTyping,
    onlineStatus,
    presenceDevice,
    notifyTyping,
    stopTyping,
    setVoiceRecordingActive,
    otherIsRecordingVoice,
    markAsRead,
    queuedCount,
  };
}
