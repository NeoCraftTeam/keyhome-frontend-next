import { describe, expect, it } from 'vitest';
import { selectConversationsForBackgroundWs } from '@/lib/chat-subscriptions';
import type { Conversation } from '@/types/chat';

function conv(uuid: string, unread: number, lastAt: string): Conversation {
  return {
    uuid,
    unread_count: unread,
    last_message_at: lastAt,
    status: 'active',
    other_participant: {
      id: 'u1',
      name: 'A B',
      avatar: null,
      last_seen_at: null,
    },
    ad: null,
    last_message: null,
  };
}

describe('selectConversationsForBackgroundWs', () => {
  it('prioritizes unread then recent, respects cap', () => {
    const list: Conversation[] = [
      conv('a', 0, '2026-01-03T00:00:00.000Z'),
      conv('b', 1, '2026-01-01T00:00:00.000Z'),
      conv('c', 1, '2026-01-02T00:00:00.000Z'),
      conv('d', 0, '2026-01-04T00:00:00.000Z'),
    ];
    const selected = selectConversationsForBackgroundWs(list, 3);
    expect(selected.map((x) => x.uuid)).toEqual(['c', 'b', 'd']);
  });

  it('fills remaining slots with read threads by recency', () => {
    const list: Conversation[] = [
      conv('r1', 0, '2026-01-01T00:00:00.000Z'),
      conv('r2', 0, '2026-01-05T00:00:00.000Z'),
      conv('u1', 2, '2026-01-03T00:00:00.000Z'),
    ];
    const selected = selectConversationsForBackgroundWs(list, 5);
    expect(selected.map((x) => x.uuid)).toEqual(['u1', 'r2', 'r1']);
  });
});
