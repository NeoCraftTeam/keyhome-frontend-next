import type { Message } from '@/types/chat';

/** Match backend `MessageResource` reply quote truncation. */
const REPLY_SNIPPET_MAX_CHARS = 80;

function snippetFromMessage(parent: Message): string | null {
  if (parent.decrypted_body != null && parent.decrypted_body !== '') {
    return [...parent.decrypted_body]
      .slice(0, REPLY_SNIPPET_MAX_CHARS)
      .join('');
  }
  if (
    parent.is_client_sealed !== true &&
    parent.body != null &&
    parent.body !== ''
  ) {
    return [...parent.body].slice(0, REPLY_SNIPPET_MAX_CHARS).join('');
  }

  return null;
}

/**
 * Fills `reply_to.body` when the API left it null (E2EE parent) but the parent
 * row is already decrypted in-memory — avoids "Message sécurisé" quotes for
 * messages the user can already read.
 */
export function enrichReplyToQuotes(messages: Message[]): Message[] {
  const byId = new Map(messages.map((m) => [m.uuid, m]));
  let changed = false;
  const out = messages.map((m) => {
    const r = m.reply_to;
    if (!r) {
      return m;
    }
    if (r.body != null && r.body !== '') {
      return m;
    }
    const parent = byId.get(r.uuid);
    if (!parent) {
      return m;
    }
    const snippet = snippetFromMessage(parent);
    if (snippet == null || snippet === '') {
      return m;
    }
    changed = true;
    return {
      ...m,
      reply_to: { ...r, body: snippet },
    };
  });

  return changed ? out : messages;
}
