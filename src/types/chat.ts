export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';
export type ConversationStatus = 'active' | 'archived' | 'blocked';

export interface MessageAttachment {
  url: string;
  signed_url: string;
  original_name: string;
  mime_type: string;
  size: number;
  type: 'image' | 'file' | 'audio';
  /** Voice notes only — duration in milliseconds (100ms..120000ms). */
  audio_duration_ms?: number | null;
  /** Voice notes only — pre-computed normalised peaks (0..1) for waveform UI. */
  audio_waveform_peaks?: number[] | null;
}

/** Aggregated per-emoji reaction count + the user IDs that reacted. */
export interface MessageReactionGroup {
  emoji: string;
  count: number;
  user_ids: string[];
}

/** Opaque AES-GCM payload; only clients with the session key can decrypt. */
export interface MessageE2eePayload {
  ciphertext_b64: string;
  iv_b64: string;
}

export interface MessageReplyTo {
  uuid: string;
  body: string | null;
  sender_id: string;
  is_client_sealed?: boolean;
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
  /** Client-sealed text: server stores ciphertext only; decrypt locally. */
  is_client_sealed?: boolean;
  e2ee?: MessageE2eePayload | null;
  /** Populated client-side after AES-GCM decrypt — never returned by the API JSON. */
  decrypted_body?: string | null;
  /**
   * Set client-side when a sealed message cannot be decrypted on this device
   * (no local private key, key mismatch after device reset, or per-message
   * corruption). Lets the bubble render a definitive "key unavailable" message
   * instead of an indefinite "Déchiffrement…" spinner.
   */
  decryption_failed?: boolean;
  attachments: MessageAttachment[] | null;
  reply_to: MessageReplyTo | null;
  /** Per-emoji aggregation. Empty array when no reactions. */
  reactions?: MessageReactionGroup[];
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
  /** Public profile slug when set; use with `/bailleurs/{username}`. */
  username: string | null;
  name: string;
  avatar: string | null;
  /** ISO-8601 timestamp of last authenticated activity. Used by `OnlineStatus`
   *  to render "Vu il y a X" when the user is offline. */
  last_seen_at: string | null;
  /** Other party's RSA public key (PEM) for E2EE session setup. */
  e2ee_public_key_pem?: string | null;
}

export interface ConversationE2eeMeta {
  both_keys_registered: boolean;
  session_ready: boolean;
  tenant_public_key_pem: string | null;
  landlord_public_key_pem: string | null;
  /** RSA-OAEP-wrapped AES session key for the authenticated participant (opaque base64). */
  wrapped_conversation_key_b64: string | null;
}

export interface Conversation {
  uuid: string;
  ad: ConversationAd | null;
  other_participant: ConversationParticipant | null;
  last_message: Partial<Message> | null;
  unread_count: number;
  status: ConversationStatus;
  last_message_at: string | null;
  e2ee?: ConversationE2eeMeta;
}

export interface TypingEvent {
  user_id: string;
  is_typing: boolean;
}

/** Client whisper on conversation channel — voice note capture in progress. */
export interface VoiceRecordingEvent {
  user_id: string;
  is_recording: boolean;
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
