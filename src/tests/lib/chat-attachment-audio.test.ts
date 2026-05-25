import { resolveChatAudioUrl } from '@/lib/chat/chat-attachment-audio';
import type { MessageAttachment } from '@/types/chat';
import { describe, expect, it } from 'vitest';

function att(partial: Partial<MessageAttachment>): MessageAttachment {
  return {
    url: partial.url ?? '',
    signed_url: partial.signed_url ?? '',
    original_name: partial.original_name ?? 'v.webm',
    mime_type: partial.mime_type ?? 'audio/webm',
    size: partial.size ?? 1,
    type: partial.type ?? 'audio',
    ...partial,
  };
}

describe('resolveChatAudioUrl', () => {
  it('prefers https signed_url', () => {
    expect(
      resolveChatAudioUrl(
        att({
          signed_url: 'https://r2.example.com/signed',
          url: 'chats/c/x.webm',
        })
      )
    ).toBe('https://r2.example.com/signed');
  });

  it('falls back to https url when signed is missing', () => {
    expect(
      resolveChatAudioUrl(
        att({ signed_url: '', url: 'https://cdn.example.com/a.mp3' })
      )
    ).toBe('https://cdn.example.com/a.mp3');
  });

  it('returns empty string for storage paths only', () => {
    expect(
      resolveChatAudioUrl(att({ signed_url: '', url: 'chats/uuid/file.webm' }))
    ).toBe('');
  });
});
