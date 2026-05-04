import type { Conversation, ConversationStatus, Message } from '@/types/chat';

/** TanStack shape returned by `/conversations` (page 1). */
export interface ConversationsListQueryData {
  data: Conversation[];
  meta: { current_page: number; last_page: number; total: number };
}

/**
 * Merge an incoming WS `message.sent` payload into the cached conversation list —
 * bumps thread to top, updates preview, adjusts row unread_count for inbound only.
 *
 * Mirrors the previous useConversations handler; called from ChatNotificationListener
 * (always mounted) so list stays correct off the Messages screen.
 */
export function applyMessageSentToConversationsCache(
  old: ConversationsListQueryData | undefined,
  event: Message,
  viewerUserId: string
): ConversationsListQueryData | undefined {
  if (!old) {
    return old;
  }

  const updated = old.data.map((c) =>
    c.uuid === event.conversation_uuid
      ? {
          ...c,
          last_message: event,
          last_message_at: event.created_at,
          unread_count:
            event.sender_id !== viewerUserId
              ? c.unread_count + 1
              : c.unread_count,
        }
      : c
  );

  updated.sort((a, b) =>
    (b.last_message_at ?? '') > (a.last_message_at ?? '') ? 1 : -1
  );

  return { ...old, data: updated };
}

/**
 * Update the cached conversation list when the OTHER participant marks a thread
 * as read — flips the inbox tick from "delivered" to "read" in real time on
 * the sender's device, even when they are currently looking at the list and
 * not the thread itself.
 *
 * Only mutates rows where `last_message.sender_id === viewerUserId` (the
 * viewer's own messages). Inbound messages don't have read receipts on the
 * sender's UI, so we skip them.
 */
export function applyMessagesReadToConversationsCache(
  old: ConversationsListQueryData | undefined,
  conversationUuid: string,
  readerId: string,
  readAt: string,
  viewerUserId: string
): ConversationsListQueryData | undefined {
  if (!old) {
    return old;
  }
  // The reader is the OTHER participant; if our own user is the reader the
  // event is just the round-trip echo and there's nothing to flip.
  if (readerId === viewerUserId) {
    return old;
  }

  let mutated = false;
  const next = old.data.map((c) => {
    if (c.uuid !== conversationUuid) return c;
    const last = c.last_message;
    if (!last || last.sender_id !== viewerUserId) return c;
    if (last.status === 'read') return c;
    mutated = true;
    return {
      ...c,
      last_message: {
        ...last,
        status: 'read' as const,
        read_at: readAt,
      },
    };
  });

  if (!mutated) return old;
  return { ...old, data: next };
}

/**
 * Set conversation row status (archived / active) from WS or after REST unarchive.
 */
export function applyConversationStatusToConversationsCache(
  old: ConversationsListQueryData | undefined,
  conversationUuid: string,
  status: ConversationStatus
): ConversationsListQueryData | undefined {
  if (!old) {
    return old;
  }

  let found = false;
  const next = old.data.map((c) => {
    if (c.uuid !== conversationUuid) {
      return c;
    }
    found = true;
    return { ...c, status };
  });

  if (!found) {
    return old;
  }

  return { ...old, data: next };
}
