import type { Conversation } from '@/types/chat';

/** Cap private channel subscriptions for global listeners (Reverb + client load). */
export const MAX_BACKGROUND_WS_CONVERSATIONS = 40;

/**
 * Prefer unread + most recent so users still get list/toast updates for active
 * threads without one Pusher channel per conversation.
 */
export function selectConversationsForBackgroundWs(
  list: Conversation[]
): Conversation[] {
  const byUnread = list
    .filter((c) => c.unread_count > 0)
    .sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  const rest = list
    .filter((c) => c.unread_count === 0)
    .sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  const unreadTake = byUnread.slice(0, MAX_BACKGROUND_WS_CONVERSATIONS);
  const slotsLeft = MAX_BACKGROUND_WS_CONVERSATIONS - unreadTake.length;
  const restTake = slotsLeft > 0 ? rest.slice(0, slotsLeft) : [];

  return [...unreadTake, ...restTake];
}
