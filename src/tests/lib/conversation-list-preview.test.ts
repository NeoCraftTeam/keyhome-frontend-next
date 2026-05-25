import { describe, expect, it } from 'vitest';
import { mergeConversationLastMessage } from '@/lib/chat/conversation-list-preview';
import type { Message } from '@/types/chat';
import type { MessagesCache } from '@/hooks/useChat';

describe('mergeConversationLastMessage', () => {
  it('returns null when API and cache are missing', () => {
    expect(mergeConversationLastMessage(null, undefined)).toBeNull();
  });

  it('returns API row when there is no cache', () => {
    const api: Partial<Message> = {
      uuid: 'a',
      body: 'hi',
      created_at: '2026-05-05T12:00:00Z',
    };
    expect(mergeConversationLastMessage(api, undefined)).toEqual(api);
  });

  it('prefers cache decrypted_body when UUID matches', () => {
    const api: Partial<Message> = {
      uuid: 'm1',
      is_client_sealed: true,
      body: null,
      created_at: '2026-05-05T12:00:00Z',
    };
    const cache: MessagesCache = {
      messages: [
        {
          uuid: 'm1',
          is_client_sealed: true,
          body: null,
          decrypted_body: 'Decoded from cache',
          created_at: '2026-05-05T12:00:00Z',
          conversation_uuid: 'c',
          sender_id: 'u',
          sender: null,
          type: 'text',
          attachments: null,
          reply_to: null,
          status: 'read',
          read_at: null,
          deleted_at: null,
        },
      ],
      hasMore: false,
      cursor: null,
    };
    const merged = mergeConversationLastMessage(api, cache);
    expect(merged?.decrypted_body).toBe('Decoded from cache');
  });

  it('uses newer cached tail when UUID differs', () => {
    const api: Partial<Message> = {
      uuid: 'old',
      body: 'old',
      created_at: '2026-05-05T10:00:00Z',
    };
    const cache: MessagesCache = {
      messages: [
        {
          uuid: 'new',
          body: 'fresh',
          created_at: '2026-05-05T11:00:00Z',
          conversation_uuid: 'c',
          sender_id: 'u',
          sender: null,
          type: 'text',
          is_client_sealed: false,
          attachments: null,
          reply_to: null,
          status: 'sent',
          read_at: null,
          deleted_at: null,
        },
      ],
      hasMore: false,
      cursor: null,
    };
    const merged = mergeConversationLastMessage(api, cache);
    expect(merged?.uuid).toBe('new');
    expect(merged?.body).toBe('fresh');
  });
});
