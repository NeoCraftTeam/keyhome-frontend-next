'use client';

/**
 * useChatSend — optimistic message send with offline queue.
 *
 * Owns:
 *  - Optimistic cache insert + conversation-list preview update
 *  - Offline queue (flush on reconnect via connectionState)
 *  - Server-encrypted plaintext send path
 *  - Delivery-status upgrade when recipient is online
 *  - File upload delegation
 *  - Message soft-delete
 *
 * E2EE sealed path is preserved but disabled by default (wantsE2ee = false).
 */

import type { MessagesCache } from '@/hooks/chat/useChatMessages';
import { OPTIMISTIC_PREFIX } from '@/hooks/chat/useChatMessages';
import {
  deleteMessage,
  sendMessage,
  uploadAttachment,
  type SendMessageInput,
} from '@/lib/chat-api';
import {
  buildSealedMessagePayload,
  convSessionAesMapKey,
} from '@/lib/chat-e2ee-crypto';
import { chatKeys } from '@/lib/query-keys';
import type { Conversation, Message, MessageAttachment } from '@/types/chat';
import type { User } from '@/types/user';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

type QueuedMessage = {
  body: string;
  attachments?: MessageAttachment[];
  replyToId?: string;
  skipE2ee?: boolean;
};

export function useChatSend(
  conversationUuid: string,
  user: User | null | undefined,
  conversation: Conversation | null | undefined,
  updateCache: (updater: (old: MessagesCache) => MessagesCache) => void,
  messagesRef: React.MutableRefObject<Message[]>,
  onlineStatus: 'online' | 'offline' | 'unknown',
  connectionState: string,
  stopTyping: () => void
): {
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
  queuedCount: number;
} {
  const queryClient = useQueryClient();
  const userId = user?.id ?? '';
  const [queuedCount, setQueuedCount] = useState(0);
  const offlineQueueRef = useRef<QueuedMessage[]>([]);
  const convAesKeyRef = useRef<Map<string, CryptoKey>>(new Map());
  const conversationRef = useRef(conversation ?? null);
  const onlineStatusRef = useRef(onlineStatus);
  const connectionStateRef = useRef(connectionState);
  const stopTypingRef = useRef(stopTyping);

  useEffect(() => {
    conversationRef.current = conversation ?? null;
  }, [conversation]);
  useEffect(() => {
    onlineStatusRef.current = onlineStatus;
  }, [onlineStatus]);
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  }, [stopTyping]);

  // Clear AES key cache on conversation or user change
  const prevConvUuidRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string>('');
  useEffect(() => {
    if (prevUserIdRef.current !== '' && prevUserIdRef.current !== userId) {
      convAesKeyRef.current.clear();
    }
    prevUserIdRef.current = userId;
    if (
      prevConvUuidRef.current !== null &&
      prevConvUuidRef.current !== conversationUuid &&
      userId
    ) {
      convAesKeyRef.current.delete(
        convSessionAesMapKey(userId, prevConvUuidRef.current)
      );
    }
    prevConvUuidRef.current = conversationUuid;
  }, [conversationUuid, userId]);

  const handleSend = useCallback(
    async (
      body: string,
      attachments?: MessageAttachment[],
      replyToId?: string,
      _skipE2ee?: boolean
    ) => {
      stopTypingRef.current();

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
      if (!user) return;

      const optimisticId = `${OPTIMISTIC_PREFIX}${Date.now()}`;
      const replyMsg = replyToId
        ? messagesRef.current.find((m) => m.uuid === replyToId)
        : undefined;
      const replyToPayload = replyMsg
        ? {
            uuid: replyMsg.uuid,
            body:
              replyMsg.decrypted_body ??
              replyMsg.body ??
              (replyMsg.is_client_sealed
                ? "Message d'un ancien appareil"
                : null),
            sender_id: replyMsg.sender_id,
            is_client_sealed: replyMsg.is_client_sealed,
          }
        : null;

      const wantsE2ee = !!conversationRef.current?.e2ee?.session_ready;

      const optimistic: Message = {
        uuid: optimisticId,
        conversation_uuid: conversationUuid,
        sender_id: user.id,
        sender: {
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
          avatar: user.avatar ?? null,
        },
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
            if (msg)
              updated.sort((a, b) =>
                (b.last_message_at ?? '') > (a.last_message_at ?? '') ? 1 : -1
              );
            return { ...old, data: updated };
          }
        );
      };
      updateConvList(optimistic);

      const sendSealed = async (): Promise<Message> => {
        const conv = conversationRef.current;
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
        const conv = conversationRef.current;
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
          } catch {
            confirmedAsSealed = false;
            confirmed = await sendPlaintext();
          }
        } else {
          confirmed = await sendPlaintext();
        }

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
        updateConvList(confirmedMsg);
      } catch (err) {
        updateCache((old) => ({
          ...old,
          messages: old.messages.filter((m) => m.uuid !== optimisticId),
        }));
        updateConvList(null);
        throw err;
      }
    },
    [conversationUuid, user, userId, updateCache, queryClient, messagesRef]
  );

  // Flush offline queue on reconnect
  useEffect(() => {
    if (connectionState !== 'connected') return;
    if (offlineQueueRef.current.length === 0) return;
    const queue = [...offlineQueueRef.current];
    offlineQueueRef.current = [];
    setQueuedCount(0);
    void (async () => {
      for (const item of queue) {
        try {
          await handleSend(
            item.body,
            item.attachments,
            item.replyToId,
            item.skipE2ee === true
          );
        } catch {
          offlineQueueRef.current.push(item);
          setQueuedCount(offlineQueueRef.current.length);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

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

  const handleUploadFile = useCallback(
    (file: File, onProgress?: (pct: number) => void) =>
      uploadAttachment(conversationUuid, file, onProgress),
    [conversationUuid]
  );

  return {
    sendMessage: handleSend,
    uploadFile: handleUploadFile,
    deleteMessage: handleDeleteMessage,
    queuedCount,
  };
}
