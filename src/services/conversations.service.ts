import api from '@/lib/api';

export interface MessageItem {
  id: string;
  body: string;
  sender_id: string;
  sender: { id: string; firstname: string; avatar: string | null } | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  ad: { id: string; title: string; slug: string } | null;
  other_party: { id: string; firstname: string; lastname: string; avatar: string | null } | null;
  last_message: { body: string; sender_id: string; created_at: string } | null;
  unread_count: number;
  updated_at: string;
}

export interface ConversationDetail extends Omit<ConversationSummary, 'last_message' | 'unread_count'> {
  messages: MessageItem[];
}

export const conversationsService = {
  list: (): Promise<{ data: ConversationSummary[] }> =>
    api.get('/conversations').then((r) => r.data),

  findOrCreate: (adId: string): Promise<ConversationDetail> =>
    api.post(`/ads/${adId}/conversation`).then((r) => r.data),

  show: (id: string): Promise<ConversationDetail> =>
    api.get(`/conversations/${id}`).then((r) => r.data),

  sendMessage: (conversationId: string, body: string): Promise<MessageItem> =>
    api.post(`/conversations/${conversationId}/messages`, { body }).then((r) => r.data),
};
