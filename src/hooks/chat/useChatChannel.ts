'use client';

/**
 * useChatChannel — WebSocket bindings for a single conversation.
 *
 * Owns:
 *  - Pusher race-safe bind/unbind on the conversation channel
 *  - Handlers for 9 server events:
 *      message.sent, messages.read, message.deleted,
 *      message.reaction.added, message.reaction.removed,
 *      client-typing, client-voice_recording,
 *      conversation.archived, conversation.unarchived
 *  - Typing + voice-recording indicator state
 *  - Delivery-status upgrade when recipient comes online
 *
 * Does NOT own: message fetch, E2EE decrypt, mark-as-read API call, send.
 */

import type { MessagesCache } from '@/hooks/chat/useChatMessages';
import { chatKeys } from '@/lib/query-keys';
import type { ConversationsListQueryData } from '@/lib/conversation-list-cache';
import { applyConversationStatusToConversationsCache } from '@/lib/conversation-list-cache';
import { getEcho, isReverbRealtimeConfigured } from '@/lib/echo';
import type {
  Conversation,
  Message,
  TypingEvent,
  VoiceRecordingEvent,
} from '@/types/chat';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { TYPING_RECEIVER_FALLBACK_MS } from '@/hooks/useTypingIndicator';

const VOICE_RECORDING_RECEIVER_FALLBACK_MS = 125_000;

export function useChatChannel(
  conversationUuid: string,
  otherParticipantId: string,
  userId: string,
  currentUserId: string | undefined,
  updateCache: (updater: (old: MessagesCache) => MessagesCache) => void,
  markAsRead: () => void
): {
  otherIsTyping: boolean;
  otherIsRecordingVoice: boolean;
} {
  const queryClient = useQueryClient();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [otherIsRecordingVoice, setOtherIsRecordingVoice] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRecTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isReverbRealtimeConfigured()) return;

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
      if (event.reader_id !== currentUserId) {
        updateCache((old) => ({
          ...old,
          messages: old.messages.map((m) =>
            m.sender_id === currentUserId && m.status !== 'read'
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

    const patchConvStatus = (
      convUuid: string,
      status: 'archived' | 'active'
    ) => {
      queryClient.setQueryData<Conversation | undefined>(
        ['conversation-single', convUuid],
        (old) => (old ? { ...old, status } : old)
      );
      if (userId) {
        queryClient.setQueryData(
          chatKeys.conversations(userId),
          (old: ConversationsListQueryData | undefined) =>
            applyConversationStatusToConversationsCache(old, convUuid, status)
        );
      }
    };

    const onConversationArchived = (raw: unknown) => {
      const e = raw as { conversation_uuid: string };
      if (e.conversation_uuid === conversationUuid)
        patchConvStatus(conversationUuid, 'archived');
    };
    const onConversationUnarchived = (raw: unknown) => {
      const e = raw as { conversation_uuid: string };
      if (e.conversation_uuid === conversationUuid)
        patchConvStatus(conversationUuid, 'active');
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

    // Race-safe Pusher bind — retries until subscription is available
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
        }
        return;
      }
      handlers.forEach(([event, handler]) => pusherCh.bind(event, handler));
    };

    tryBind();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (pusherCh) {
        handlers.forEach(([event, handler]) => pusherCh.unbind(event, handler));
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (voiceRecTimeoutRef.current) clearTimeout(voiceRecTimeoutRef.current);
    };
  }, [
    conversationUuid,
    otherParticipantId,
    userId,
    currentUserId,
    queryClient,
    markAsRead,
    updateCache,
  ]);

  return { otherIsTyping, otherIsRecordingVoice };
}
