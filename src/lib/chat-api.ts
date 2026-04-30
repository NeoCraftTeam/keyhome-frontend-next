import api from '@/lib/api';
import type {
  Conversation,
  Message,
  MessageAttachment,
  MessageHistoryResponse,
  UnreadCountResponse,
} from '@/types/chat';
import type { AxiosResponse } from 'axios';

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Fetch the paginated conversation list for the authenticated user.
 */
export async function fetchConversations(page = 1): Promise<{
  data: Conversation[];
  meta: { current_page: number; last_page: number; total: number };
}> {
  const res: AxiosResponse = await api.get('/conversations', {
    params: { page },
  });
  return res.data as {
    data: Conversation[];
    meta: { current_page: number; last_page: number; total: number };
  };
}

/**
 * Find or create a conversation after unlocking an ad.
 * Returns { conversation, isNew: boolean }
 */
export async function findOrCreateConversation(
  adId: string
): Promise<{ conversation: Conversation; isNew: boolean }> {
  const res: AxiosResponse = await api.post('/conversations', { ad_id: adId });
  return {
    conversation: res.data.data as Conversation,
    isNew: res.status === 201,
  };
}

/**
 * Fetch a single conversation by UUID.
 */
export async function fetchConversation(uuid: string): Promise<Conversation> {
  const res: AxiosResponse = await api.get(`/conversations/${uuid}`);
  return res.data.data as Conversation;
}

/**
 * Archive a conversation.
 */
export async function archiveConversation(uuid: string): Promise<void> {
  await api.patch(`/conversations/${uuid}/archive`);
}

/**
 * Get total unread message count (cached 30s server-side).
 */
export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const res: AxiosResponse = await api.get('/conversations/unread-count');
  return res.data as UnreadCountResponse;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Fetch cursor-paginated message history for a conversation.
 * Also triggers a server-side markAsRead.
 */
export async function fetchMessages(
  uuid: string,
  cursor?: string | null
): Promise<MessageHistoryResponse> {
  const res: AxiosResponse = await api.get(`/conversations/${uuid}/messages`, {
    params: cursor ? { cursor } : undefined,
  });
  return res.data as MessageHistoryResponse;
}

/**
 * Send a text message (with optional reply and attachments).
 */
export async function sendMessage(
  uuid: string,
  params: {
    body?: string;
    type?: 'text' | 'image' | 'file';
    reply_to_id?: string;
    attachments?: MessageAttachment[];
  }
): Promise<Message> {
  const res: AxiosResponse = await api.post(
    `/conversations/${uuid}/messages`,
    params
  );
  return res.data.data as Message;
}

/**
 * Upload a file attachment. Returns the attachment descriptor with signed URL.
 * Upload before sending the message; include the descriptor in the message payload.
 */
export async function uploadAttachment(
  uuid: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<MessageAttachment> {
  const form = new FormData();
  form.append('file', file);

  const res: AxiosResponse = await api.post(
    `/conversations/${uuid}/attachments`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );

  return res.data.data as MessageAttachment;
}

/**
 * Soft-delete a message (sender only, within 24 hours).
 */
export async function deleteMessage(messageUuid: string): Promise<void> {
  await api.delete(`/messages/${messageUuid}`);
}

/**
 * Mark all messages in a conversation as read for the authenticated user.
 */
export async function markConversationAsRead(uuid: string): Promise<void> {
  await api.patch(`/conversations/${uuid}/read`);
}

// ─── Typing ───────────────────────────────────────────────────────────────────

/**
 * Emit a typing indicator event (throttled server-side at 30/min).
 */
export async function setTyping(
  uuid: string,
  isTyping: boolean
): Promise<void> {
  await api.post(`/conversations/${uuid}/typing`, { is_typing: isTyping });
}

// ─── FCM ──────────────────────────────────────────────────────────────────────

/**
 * Register an FCM token for the authenticated user.
 */
export async function registerFcmToken(
  token: string,
  platform: 'web' | 'android' | 'ios' = 'web'
): Promise<void> {
  await api.post('/fcm/token', { token, platform });
}

/**
 * Remove an FCM token (on logout or permission revocation).
 */
export async function removeFcmToken(token: string): Promise<void> {
  await api.delete('/fcm/token', { data: { token } });
}
