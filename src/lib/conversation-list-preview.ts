import type { Message } from '@/types/chat';
import type { MessagesCache } from '@/hooks/useChat';

function parseTimeMs(iso: string | undefined): number {
  if (iso == null || iso === '') {
    return 0;
  }
  const t = Date.parse(iso);

  return Number.isNaN(t) ? 0 : t;
}

/**
 * Merge REST/WS `last_message` with the newest row from the TanStack messages
 * cache (same UUID → prefer cache for `decrypted_body`; else pick newer time).
 */
export function mergeConversationLastMessage(
  api: Partial<Message> | null | undefined,
  messagesCache: MessagesCache | undefined
): Partial<Message> | null {
  const newestCached =
    messagesCache != null &&
    messagesCache.messages != null &&
    messagesCache.messages.length > 0
      ? messagesCache.messages[messagesCache.messages.length - 1]
      : null;

  if (api == null) {
    return newestCached ?? null;
  }

  if (newestCached == null) {
    return api;
  }

  if (newestCached.uuid === api.uuid) {
    return { ...api, ...newestCached };
  }

  const apiTime = parseTimeMs(
    api.created_at ?? (api as { sent_at?: string }).sent_at
  );
  const cacheTime = parseTimeMs(newestCached.created_at);

  return cacheTime >= apiTime ? { ...api, ...newestCached } : api;
}
