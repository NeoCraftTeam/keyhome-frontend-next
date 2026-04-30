export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type ConversationStatus = 'active' | 'archived' | 'blocked';

export interface MessageAttachment {
  url: string;
  signed_url: string;
  original_name: string;
  mime_type: string;
  size: number;
  type: 'image' | 'file';
}

export interface MessageReplyTo {
  uuid: string;
  body: string | null;
  sender_id: string;
}

export interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Message {
  uuid: string;
  conversation_uuid: string;
  sender_id: string;
  sender: MessageSender | null;
  type: MessageType;
  body: string | null;
  attachments: MessageAttachment[] | null;
  reply_to: MessageReplyTo | null;
  status: MessageStatus;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface ConversationAd {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar: string | null;
  /** ISO-8601 timestamp of last authenticated activity. Used by `OnlineStatus`
   *  to render "Vu il y a X" when the user is offline. */
  last_seen_at: string | null;
}

export interface Conversation {
  uuid: string;
  ad: ConversationAd | null;
  other_participant: ConversationParticipant | null;
  last_message: Partial<Message> | null;
  unread_count: number;
  status: ConversationStatus;
  last_message_at: string | null;
}

export interface TypingEvent {
  user_id: string;
  is_typing: boolean;
}

export interface UnreadCountResponse {
  total: number;
  conversations: { uuid: string; count: number }[];
}

export interface MessageHistoryResponse {
  data: Message[];
  next_cursor: string | null;
  has_more: boolean;
}
