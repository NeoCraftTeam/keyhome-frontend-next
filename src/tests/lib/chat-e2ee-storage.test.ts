import { describe, expect, it } from 'vitest';
import { chatE2eeStorageKeyForUser } from '@/lib/chat-e2ee-crypto';

describe('chatE2eeStorageKeyForUser', () => {
  it('namespaces storage by user id for multi-account and logout-safe keys', () => {
    expect(chatE2eeStorageKeyForUser('user-uuid-one')).toBe(
      'kh:chat-e2ee:v1:user-uuid-one'
    );
  });
});
