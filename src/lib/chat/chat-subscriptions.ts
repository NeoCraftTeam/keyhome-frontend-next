import type { Conversation } from '@/types/chat';

const parsedCap = Number(process.env.NEXT_PUBLIC_CHAT_BACKGROUND_WS_CAP);

/**
 * Cap private channel subscriptions for global listeners (Reverb + client load).
 * Default raised from 40 → 72 for heavier chat users; override with
 * `NEXT_PUBLIC_CHAT_BACKGROUND_WS_CAP` (8–200) if Reverb limits require it.
 */
export const MAX_BACKGROUND_WS_CONVERSATIONS =
  Number.isFinite(parsedCap) && parsedCap >= 8 && parsedCap <= 200
    ? Math.floor(parsedCap)
    : 72;

/**
 * Prefer unread + most recent so users still get list/toast updates for active
 * threads without one Pusher channel per conversation.
 */
export function selectConversationsForBackgroundWs(
  list: Conversation[],
  cap = MAX_BACKGROUND_WS_CONVERSATIONS
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
  const unreadTake = byUnread.slice(0, cap);
  const slotsLeft = cap - unreadTake.length;
  const restTake = slotsLeft > 0 ? rest.slice(0, slotsLeft) : [];

  return [...unreadTake, ...restTake];
}
