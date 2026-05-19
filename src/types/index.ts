// ============================================================
// KeyHome — type barrel
// Re-exports all domain types from their canonical files.
// DO NOT add new definitions here; add them in the domain file.
// ============================================================

// ── User ────────────────────────────────────────────────────
export { UserRole, UserType } from './user';
export type { User } from './user';

// ── Ad ──────────────────────────────────────────────────────
export { AdStatus, PropertyAttribute } from './ad';
export type {
  GeoLocation,
  City,
  Quarter,
  AdType,
  AdImage,
  TourHotspot,
  TourScene,
  TourConfig,
  Agency,
  Review,
  Ad,
} from './ad';

// ── Payment ─────────────────────────────────────────────────
export { PaymentStatus, PaymentType, PaymentMethod } from './payment';
export type {
  PaymentGateway,
  FlutterwaveInitiatePayload,
  PaymentInitiateStatus,
  FlutterwaveInitiateResponse,
  StripePaymentMethod,
  StripeSetupIntent,
  PaymentMethodInfo,
  FlutterwaveVerifyResponse,
  PaymentHistoryItem,
  Payment,
  UnlockedAd,
  PointPackage,
  UnlockResponse,
  CreditPurchaseResponse,
  CreditVerifyResponse,
  PaymentInitResponse,
} from './payment';

// ── Viewing ─────────────────────────────────────────────────
export { ReservationStatus, CancelledBy } from './viewing';
export type {
  BookableSlot,
  Reservation,
  CreateReservationPayload,
  SlotsResponse,
} from './viewing';

// ── Search ──────────────────────────────────────────────────
export type {
  AutocompleteResult,
  FacetsResponse,
  SearchParams,
  NearbyParams,
} from './search';

// ── Survey ──────────────────────────────────────────────────
export type {
  QuestionType,
  SurveyQuestion,
  Survey,
  PublicSurvey,
  SurveyAnswerPayload,
} from './survey';

// ── Chat ────────────────────────────────────────────────────
export type {
  MessageStatus,
  MessageType,
  ConversationStatus,
  MessageAttachment,
  MessageReactionGroup,
  MessageE2eePayload,
  MessageReplyTo,
  MessageSender,
  Message,
  ConversationAd,
  ConversationParticipant,
  ConversationE2eeMeta,
  Conversation,
  TypingEvent,
  VoiceRecordingEvent,
  UnreadCountResponse,
  MessageHistoryResponse,
} from './chat';

// ── Shared pagination (not domain-specific) ─────────────────
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

/** Laravel cursor paginator (`cursorPaginate`) — home feed, infinite scroll. */
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor?: string | null;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

import type { User } from './user';

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}
