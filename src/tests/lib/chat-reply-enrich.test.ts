import { enrichReplyToQuotes } from '@/lib/chat-reply-enrich';
import type { Message } from '@/types/chat';
import { describe, expect, it } from 'vitest';

function baseMsg(overrides: Partial<Message>): Message {
  return {
    uuid: 'm1',
    conversation_uuid: 'c1',
    sender_id: 'u1',
    sender: null,
    type: 'text',
    body: null,
    is_client_sealed: false,
    e2ee: null,
    attachments: null,
    reply_to: null,
    status: 'sent',
    read_at: null,
    created_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

describe('enrichReplyToQuotes', () => {
  it('fills reply_to.body from parent decrypted_body when API omitted it', () => {
    const parent = baseMsg({
      uuid: 'parent-1',
      is_client_sealed: true,
      decrypted_body: 'Hello from sealed world',
      e2ee: { ciphertext_b64: 'x', iv_b64: 'y' },
    });
    const reply = baseMsg({
      uuid: 'reply-1',
      reply_to: {
        uuid: 'parent-1',
        body: null,
        sender_id: 'u2',
        is_client_sealed: true,
      },
    });
    const out = enrichReplyToQuotes([parent, reply]);
    expect(out[1].reply_to?.body).toBe('Hello from sealed world');
  });

  it('uses server-encrypted parent.body when not sealed', () => {
    const parent = baseMsg({
      uuid: 'p2',
      is_client_sealed: false,
      body: 'Plain text hi',
    });
    const reply = baseMsg({
      uuid: 'r2',
      reply_to: {
        uuid: 'p2',
        body: null,
        sender_id: 'u2',
        is_client_sealed: false,
      },
    });
    const out = enrichReplyToQuotes([parent, reply]);
    expect(out[1].reply_to?.body).toBe('Plain text hi');
  });

  it('returns the same array reference when nothing changes', () => {
    const parent = baseMsg({ uuid: 'p3', body: 'x' });
    const list = [parent];
    expect(enrichReplyToQuotes(list)).toBe(list);
  });

  it('truncates long decrypted_body to 80 Unicode code points', () => {
    const long = 'あ'.repeat(100);
    expect([...long].length).toBe(100);
    const parent = baseMsg({
      uuid: 'p4',
      is_client_sealed: true,
      decrypted_body: long,
    });
    const reply = baseMsg({
      uuid: 'r4',
      reply_to: {
        uuid: 'p4',
        body: null,
        sender_id: 'u1',
        is_client_sealed: true,
      },
    });
    const out = enrichReplyToQuotes([parent, reply]);
    expect(out[1].reply_to?.body?.length).toBe(80);
    expect(out[1].reply_to?.body).toBe([...long].slice(0, 80).join(''));
  });
});
