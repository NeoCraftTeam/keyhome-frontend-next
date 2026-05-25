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
  Ad,
  AdImage,
  AdType,
  Agency,
  City,
  GeoLocation,
  Quarter,
  Review,
  TourConfig,
  TourHotspot,
  TourScene,
} from './ad';

// ── Payment ─────────────────────────────────────────────────
export { PaymentMethod, PaymentStatus, PaymentType } from './payment';
export type {
  CreditPurchaseResponse,
  CreditVerifyResponse,
  FlutterwaveInitiatePayload,
  FlutterwaveInitiateResponse,
  FlutterwaveVerifyResponse,
  Payment,
  PaymentGateway,
  PaymentHistoryItem,
  PaymentInitiateStatus,
  PaymentMethodInfo,
  PointPackage,
  StripePaymentMethod,
  StripeSetupIntent,
  UnlockedAd,
  UnlockResponse,
  UserRefund,
} from './payment';

// ── Viewing ─────────────────────────────────────────────────
export { CancelledBy, ReservationStatus } from './viewing';
export type {
  BookableSlot,
  CreateReservationPayload,
  Reservation,
  SlotsResponse,
} from './viewing';

// ── Search ──────────────────────────────────────────────────
export type {
  AutocompleteResult,
  FacetsResponse,
  NearbyParams,
  SearchParams,
} from './search';

// ── Survey ──────────────────────────────────────────────────
export type {
  PublicSurvey,
  QuestionType,
  Survey,
  SurveyAnswerPayload,
  SurveyQuestion,
} from './survey';

// ── Chat ────────────────────────────────────────────────────
export type {
  Conversation,
  ConversationAd,
  ConversationE2eeMeta,
  ConversationParticipant,
  ConversationStatus,
  Message,
  MessageAttachment,
  MessageE2eePayload,
  MessageHistoryResponse,
  MessageReactionGroup,
  MessageReplyTo,
  MessageSender,
  MessageStatus,
  MessageType,
  TypingEvent,
  UnreadCountResponse,
  VoiceRecordingEvent,
} from './chat';

// ── Dispute ────────────────────────────────────────────────
export type {
  CreateDisputePayload,
  Dispute,
  DisputeEvidence,
  DisputeEvidenceType,
  DisputeMessage,
  DisputeParty,
  DisputeStatus,
  DisputeType,
} from './dispute';

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
  /** Approximate total count — cached 10 min server-side (gap #3 audit). */
  total_approximate?: number;
}

import type { User } from './user';

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}
