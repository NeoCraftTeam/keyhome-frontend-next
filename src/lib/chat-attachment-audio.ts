import type { MessageAttachment } from '@/types/chat';

/**
 * Prefer HTTPS signed URL for chat audio playback.
 * Storage paths (e.g. chats/...) are not playable in the browser — omit them so
 * the UI can surface an error / retry after refresh.
 */
export function resolveChatAudioUrl(attachment: MessageAttachment): string {
  const signed = attachment.signed_url?.trim() ?? '';
  if (signed.startsWith('https://') || signed.startsWith('http://')) {
    return signed;
  }
  const raw = attachment.url?.trim() ?? '';
  if (raw.startsWith('https://') || raw.startsWith('http://')) {
    return raw;
  }

  return '';
}
