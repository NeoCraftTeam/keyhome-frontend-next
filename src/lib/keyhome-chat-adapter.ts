/**
 * MUI X Chat adapter for KeyHome P2P messaging.
 *
 * Bridges the MUI X Chat store to our Laravel API + Echo/Pusher WebSockets.
 *
 * Data flow:
 *   listConversations → GET /api/v1/conversations
 *   listMessages      → GET /api/v1/conversations/{uuid}/messages
 *   sendMessage       → POST /api/v1/conversations/{uuid}/messages
 *   setTyping         → POST /api/v1/conversations/{uuid}/typing
 *   markRead          → PATCH /api/v1/conversations/{uuid}/read
 *   subscribe         → Echo private channels per conversation + presence
 *
 * Key design decisions:
 * - Message dedup: sendMessage stores confirmed UUIDs; subscribe skips them.
 * - Optimistic → confirmed: after API confirms, remove local ID + add server msg.
 * - Never calls echo.leave() — uses direct Pusher bind/unbind (shared channels).
 * - Presence via `online-users` presence channel.
 */
import type {
  ChatAdapter,
  ChatRealtimeEvent,
  ChatConversation,
} from '@mui/x-chat/headless';
import type {
  ChatMessage,
  ChatMessagePart,
  ChatMessageStatus,
} from '@mui/x-chat/headless';
import * as chatApi from '@/lib/chat-api';
import type {
  Conversation,
  Message,
  MessageAttachment,
  TypingEvent,
} from '@/types/chat';
import { getEcho } from '@/lib/echo';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface KeyHomeChatAdapterOptions {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapConversation(c: Conversation): ChatConversation {
  return {
    id: c.uuid,
    title: c.other_participant?.name ?? 'Conversation',
    subtitle: c.ad?.title ?? undefined,
    avatarUrl: c.other_participant?.avatar ?? undefined,
    participants: c.other_participant
      ? [
          {
            id: c.other_participant.id,
            displayName: c.other_participant.name,
            avatarUrl: c.other_participant.avatar ?? undefined,
          },
        ]
      : [],
    unreadCount: c.unread_count,
    readState: c.unread_count > 0 ? 'unread' : 'read',
    lastMessageAt: c.last_message_at ?? undefined,
  };
}

function mapMessageStatus(status: string): ChatMessageStatus {
  switch (status) {
    case 'sending':
      return 'sending';
    case 'read':
      return 'read';
    case 'delivered':
    case 'sent':
    default:
      return 'sent';
  }
}

function createMapMessage(currentUserId: string) {
  return function mapMsg(m: Message): ChatMessage {
    const isMine = m.sender_id === currentUserId;
    const parts: ChatMessagePart[] = [];

    if (m.deleted_at) {
      parts.push({ type: 'text', text: '🚫 Message supprimé' });
    } else {
      if (m.body) {
        parts.push({ type: 'text', text: m.body });
      }
      if (m.attachments?.length) {
        for (const a of m.attachments) {
          parts.push({
            type: 'file',
            mediaType: a.mime_type,
            url: a.signed_url || a.url,
            filename: a.original_name,
          });
        }
      }
      if (parts.length === 0) {
        parts.push({ type: 'text', text: '' });
      }
    }

    return {
      id: m.uuid,
      conversationId: m.conversation_uuid,
      role: isMine ? 'user' : 'assistant',
      parts,
      createdAt: m.created_at,
      status: mapMessageStatus(m.status),
      author: m.sender
        ? {
            id: m.sender.id,
            displayName: m.sender.name,
            avatarUrl: m.sender.avatar ?? undefined,
          }
        : { id: m.sender_id },
    };
  };
}

// ─── Adapter factory ──────────────────────────────────────────────────────────

export function createKeyHomeChatAdapter(
  options: KeyHomeChatAdapterOptions
): ChatAdapter<string> {
  const { currentUserId, currentUserName, currentUserAvatar } = options;
  void currentUserName;
  void currentUserAvatar;

  const mapMessage = createMapMessage(currentUserId);

  // Internal state
  let eventCallback: ((event: ChatRealtimeEvent) => void) | undefined;
  const recentlySentIds = new Set<string>();
  const conversationCache = new Map<string, ChatConversation>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelBindings = new Map<
    string,
    Array<{ event: string; handler: (...args: any[]) => void }>
  >();
  let presenceCleanup: (() => void) | undefined;

  // ─── Channel subscription (lazy, per-conversation) ─────────────────────────

  function ensureChannelSubscription(conversationId: string) {
    if (channelBindings.has(conversationId) || !eventCallback) return;

    const echo = getEcho();
    const echoChannel = echo.private(`conversation.${conversationId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pusherCh = (echoChannel as any).subscription;
    if (!pusherCh) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers: Array<{
      event: string;
      handler: (...args: any[]) => void;
    }> = [];

    // message.sent — new message in conversation
    const onMessageSent = (event: Message) => {
      if (recentlySentIds.has(event.uuid)) return; // already added via sendMessage

      eventCallback?.({ type: 'message-added', message: mapMessage(event) });

      // Bump conversation to top
      const existing = conversationCache.get(conversationId);
      if (existing) {
        const updated: ChatConversation = {
          ...existing,
          lastMessageAt: event.created_at,
          unreadCount:
            event.sender_id !== currentUserId
              ? (existing.unreadCount ?? 0) + 1
              : existing.unreadCount,
        };
        conversationCache.set(conversationId, updated);
        eventCallback?.({
          type: 'conversation-updated',
          conversation: updated,
        });
      }
    };

    // messages.read — other party read our messages
    const onMessagesRead = (event: { reader_id: string; read_at: string }) => {
      if (event.reader_id !== currentUserId) {
        eventCallback?.({
          type: 'read',
          conversationId,
          userId: event.reader_id,
        });
      }
    };

    // message.deleted — a message was soft-deleted
    const onMessageDeleted = (event: { message_uuid: string }) => {
      eventCallback?.({
        type: 'message-removed',
        messageId: event.message_uuid,
        conversationId,
      });
    };

    // user.typing — typing indicator
    const onUserTyping = (event: TypingEvent) => {
      if (event.user_id !== currentUserId) {
        eventCallback?.({
          type: 'typing',
          conversationId,
          userId: event.user_id,
          isTyping: event.is_typing,
        });
      }
    };

    pusherCh.bind('message.sent', onMessageSent);
    pusherCh.bind('messages.read', onMessagesRead);
    pusherCh.bind('message.deleted', onMessageDeleted);
    pusherCh.bind('user.typing', onUserTyping);

    handlers.push(
      { event: 'message.sent', handler: onMessageSent },
      { event: 'messages.read', handler: onMessagesRead },
      { event: 'message.deleted', handler: onMessageDeleted },
      { event: 'user.typing', handler: onUserTyping }
    );

    channelBindings.set(conversationId, handlers);
  }

  // ─── Presence channel ──────────────────────────────────────────────────────

  function setupPresence() {
    const echo = getEcho();
    const channelName = 'presence-online-users';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pusherChannel = (echo.connector as any).pusher?.channel(channelName);

    if (!pusherChannel) {
      echo.join('online-users');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pusherChannel = (echo.connector as any).pusher?.channel(channelName);
    }
    if (!pusherChannel) return;

    const onAdded = (member: { id: string }) => {
      eventCallback?.({
        type: 'presence',
        userId: String(member.id),
        isOnline: true,
      });
    };
    const onRemoved = (member: { id: string }) => {
      eventCallback?.({
        type: 'presence',
        userId: String(member.id),
        isOnline: false,
      });
    };

    pusherChannel.bind('pusher:member_added', onAdded);
    pusherChannel.bind('pusher:member_removed', onRemoved);

    presenceCleanup = () => {
      pusherChannel.unbind('pusher:member_added', onAdded);
      pusherChannel.unbind('pusher:member_removed', onRemoved);
    };
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  function cleanupAll() {
    const echo = getEcho();
    channelBindings.forEach((handlers, convId) => {
      const echoChannel = echo.private(`conversation.${convId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pusherCh = (echoChannel as any).subscription;
      if (pusherCh) {
        handlers.forEach(({ event, handler }) =>
          pusherCh.unbind(event, handler)
        );
      }
    });
    channelBindings.clear();
    presenceCleanup?.();
    presenceCleanup = undefined;
    eventCallback = undefined;
  }

  // ─── Adapter ───────────────────────────────────────────────────────────────

  const adapter: ChatAdapter<string> = {
    async listConversations(input) {
      const page = input?.cursor ? parseInt(input.cursor, 10) : 1;
      const res = await chatApi.fetchConversations(page);
      const mapped = res.data.map(mapConversation);

      // Cache + subscribe
      for (const c of mapped) {
        conversationCache.set(c.id, c);
        ensureChannelSubscription(c.id);
      }

      return {
        conversations: mapped,
        cursor:
          res.meta.current_page < res.meta.last_page
            ? String(res.meta.current_page + 1)
            : undefined,
        hasMore: res.meta.current_page < res.meta.last_page,
      };
    },

    async listMessages(input) {
      const res = await chatApi.fetchMessages(
        input.conversationId,
        input.cursor || null
      );
      ensureChannelSubscription(input.conversationId);

      return {
        messages: [...res.data].reverse().map(mapMessage),
        cursor: res.next_cursor ?? undefined,
        hasMore: res.has_more,
      };
    },

    async sendMessage(input) {
      const textPart = input.message.parts.find((p) => p.type === 'text');
      const text = textPart && 'text' in textPart ? textPart.text : '';
      const convId = input.conversationId ?? input.message.conversationId ?? '';

      // Upload draft attachments first
      let attachments: MessageAttachment[] | undefined;
      if (input.attachments?.length) {
        attachments = await Promise.all(
          input.attachments.map((a) => chatApi.uploadAttachment(convId, a.file))
        );
      }

      try {
        const confirmed = await chatApi.sendMessage(convId, {
          body: text || undefined,
          type:
            attachments?.[0]?.type === 'image'
              ? 'image'
              : attachments?.length
                ? 'file'
                : 'text',
          attachments,
        });

        // Dedup: skip the WS echo of this message
        recentlySentIds.add(confirmed.uuid);
        setTimeout(() => recentlySentIds.delete(confirmed.uuid), 15_000);

        // Replace optimistic message with server-confirmed one
        eventCallback?.({
          type: 'message-removed',
          messageId: input.message.id,
          conversationId: convId,
        });
        eventCallback?.({
          type: 'message-added',
          message: mapMessage(confirmed),
        });

        // Update conversation last message timestamp
        const existing = conversationCache.get(convId);
        if (existing) {
          const updated = { ...existing, lastMessageAt: confirmed.created_at };
          conversationCache.set(convId, updated);
          eventCallback?.({
            type: 'conversation-updated',
            conversation: updated,
          });
        }
      } catch (error) {
        // Remove failed optimistic message
        eventCallback?.({
          type: 'message-removed',
          messageId: input.message.id,
          conversationId: convId,
        });
        throw error;
      }

      // P2P: no streaming response — return closed stream
      return new ReadableStream({ start: (c) => c.close() });
    },

    async setTyping(input) {
      await chatApi
        .setTyping(input.conversationId, input.isTyping)
        .catch(() => {});
    },

    async markRead(input) {
      await chatApi
        .markConversationAsRead(input.conversationId)
        .catch(() => {});
    },

    subscribe(input) {
      eventCallback = input.onEvent;

      // Subscribe to presence channel
      setupPresence();

      // Subscribe to all known conversation channels
      conversationCache.forEach((_, id) => ensureChannelSubscription(id));

      return () => cleanupAll();
    },
  };

  return adapter;
}
