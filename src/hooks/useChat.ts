'use client';

/**
 * useChat — thin composer for a single conversation.
 *
 * Delegates to focused sub-hooks:
 *  - useChatMessages   → TanStack Query cache + pagination + reply enrichment
 *  - useMarkAsRead     → focus + visibility auto-read
 *  - useChatChannel    → WebSocket bindings (9 server events)
 *  - useChatSend       → optimistic send + offline queue + file upload + delete
 *  - useChatReactions  → optimistic reaction toggle with rollback
 *  - usePresence       → other participant online status
 *  - useTypingIndicator → typing whispers
 *
 * This file should remain a composition layer — no business logic here.
 */

import { useChatChannel } from '@/hooks/chat/useChatChannel';
import {
  CHAT_MESSAGES_STALE_MS,
  chatMessagesKey,
  MessagesCache,
  OPTIMISTIC_PREFIX,
  prefetchChatMessages,
  useChatMessages,
} from '@/hooks/chat/useChatMessages';
import { useChatReactions } from '@/hooks/chat/useChatReactions';
import { useChatSend } from '@/hooks/chat/useChatSend';
import { useMarkAsRead } from '@/hooks/chat/useMarkAsRead';
import { useEchoConnectionState } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';
import type { Conversation, Message, MessageAttachment } from '@/types/chat';
import { useState } from 'react';
import type { DeviceType } from './usePresence';
import { usePresence } from './usePresence';
import { useTypingIndicator } from './useTypingIndicator';

// Re-export cache helpers so existing callers don't need to change imports
export {
  chatMessagesKey,
  CHAT_MESSAGES_STALE_MS,
  OPTIMISTIC_PREFIX,
  prefetchChatMessages,
};
export type { MessagesCache };

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
  queuedCount: number;
} {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const connectionState = useEchoConnectionState();
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const {
    messages,
    isLoading,
    isFetching,
    isError,
    hasMore,
    refetch,
    loadMore,
    updateCache,
    messagesRef,
  } = useChatMessages(userId, conversationUuid);

  const { markAsRead } = useMarkAsRead(conversationUuid, user);

  const { otherIsTyping, otherIsRecordingVoice } = useChatChannel(
    conversationUuid,
    otherParticipantId,
    userId,
    user?.id,
    updateCache,
    markAsRead
  );

  const { status: onlineStatus, device: presenceDevice } =
    usePresence(otherParticipantId);
  const { notifyTyping, stopTyping, setVoiceRecordingActive } =
    useTypingIndicator(conversationUuid);

  const { sendMessage, uploadFile, deleteMessage, queuedCount } = useChatSend(
    conversationUuid,
    user,
    conversation,
    updateCache,
    messagesRef,
    onlineStatus,
    connectionState,
    stopTyping
  );

  const { toggleReaction } = useChatReactions(user, updateCache);

  return {
    messages,
    isLoading,
    isFetching,
    isMessagesError: isError,
    refetchMessages: refetch,
    hasMore,
    loadMore,
    sendMessage,
    uploadFile,
    deleteMessage,
    toggleReaction,
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
