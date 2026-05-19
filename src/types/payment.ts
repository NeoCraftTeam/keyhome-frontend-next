export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum PaymentType {
  UNLOCK = 'unlock',
  SUBSCRIPTION = 'subscription',
  BOOST = 'boost',
  CREDIT = 'credit',
}

export enum PaymentMethod {
  ORANGE_MONEY = 'orange_money',
  MOBILE_MONEY = 'mobile_money',
  CARD = 'card',
  STRIPE = 'stripe',
  FLUTTERWAVE = 'flutterwave',
}

export type PaymentGateway = 'flutterwave' | 'stripe';

/**
 * Catalogue entry returned by `GET /api/v1/payments/methods`
 * (PaymentMethodGateService::describeAvailable / describeAll).
 */
export interface PaymentMethodInfo {
  value: string;
  label: string;
  gateway: PaymentGateway;
  enabled: boolean;
}

export interface FlutterwaveInitiatePayload {
  type: 'unlock' | 'subscription' | 'credit';
  payment_method?: 'mobile_money' | 'orange_money' | 'flutterwave' | 'card';
  phone_number?: string;
  ad_id?: string | null;
  agency_id?: string | null;
  plan_id?: string | null;
  period?: 'monthly' | 'yearly' | null;
  /**
   * Stripe-only. When `true`, the PaymentIntent is created with
   * `setup_future_usage: 'off_session'` so the card is attached to the
   * authenticated user's Stripe Customer on success and can be reused
   * without re-entering details.
   */
  save_payment_method?: boolean;
  /**
   * Stripe-only. When provided, the PaymentIntent is created with
   * `payment_method: <id>` + `confirm: true` + `off_session: true` so a
   * previously saved card can be charged in one round-trip (no Stripe
   * Elements rendering required).
   */
  payment_method_id?: string;
  /** Cloudflare Turnstile token for enforced credit flows. */
  turnstile_token?: string | null;
}

/**
 * Normalised gateway status returned by the backend's central orchestrator.
 *
 *  - `pending` — default; the gateway is awaiting user input (Stripe Elements
 *    or Flutterwave hosted checkout).
 *  - `success` — only emitted by Stripe when an off-session charge against a
 *    saved card cleared without a 3DS challenge. Frontend can skip the
 *    verify roundtrip.
 *  - `failed` — Stripe rejected the saved-card off-session call (insufficient
 *    funds, expired card, etc.). Surface the error to the user.
 *  - `requires_action` — Stripe needs a 3DS challenge to confirm the
 *    off-session charge. Frontend must still mount Stripe Elements and call
 *    `stripe.confirmCardPayment(clientSecret)`.
 *  - `cancelled` — explicit user cancel before any confirmation.
 */
export type PaymentInitiateStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'requires_action'
  | 'cancelled';

export interface FlutterwaveInitiateResponse {
  reference: string;
  payment_link: string;
  tx_ref: string;
  gateway: PaymentGateway | 'stripe';
  status: PaymentInitiateStatus;
}

/**
 * A Stripe `PaymentMethod` of type `card` attached to the authenticated
 * user's Stripe Customer. Returned by `GET /payments/stripe/payment-methods`
 * and consumed by the saved-card UI (selector + profile management section).
 *
 * `is_default` mirrors Stripe's `invoice_settings.default_payment_method` —
 * the card automatically pre-selected when the user pays again.
 */
export interface StripePaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

/**
 * Stripe SetupIntent client secret + ID returned by
 * `POST /payments/stripe/setup-intent`. Used by the profile "Ajouter une
 * carte" flow to collect new card details *without* charging the user.
 */
export interface StripeSetupIntent {
  client_secret: string;
  id: string;
}

export interface FlutterwaveVerifyResponse {
  status: string;
  is_paid: boolean;
  is_unlocked: boolean;
  reference: string;
  ad_id: string | null;
  tx_ref: string;
  gateway: PaymentGateway;
}

export interface PaymentHistoryItem {
  id: string;
  reference: string | null;
  status: string;
  type: string;
  amount: number;
  gateway: PaymentGateway | null;
  gateway_label?: string | null;
  payment_method: string | null;
  payment_method_label?: string | null;
  payment_method_detail?: string | null;
  phone_number: string | null;
  payment_link: string | null;
  ad: { id: string } | null;
  agency_id: string | null;
  pack_name: string | null;
  points_awarded: number | null;
  created_at: string;
}

export interface Payment {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface UnlockedAd {
  id: string;
  unlocked_at: string;
  ad_id: string;
  user_id: string;
  payment_id: string | null;
}

export interface PointPackage {
  id: string;
  name: string;
  description: string | null;
  badge: string | null;
  price: number;
  price_formatted: string;
  points_awarded: number;
  features: string[];
  is_popular: boolean;
  sort_order: number;
}

export interface UnlockResponse {
  status: 'unlocked' | 'insufficient_points' | 'owner' | 'already_unlocked';
  message?: string;
  points_used?: number;
  points_balance?: number;
  packages?: PointPackage[];
  required_points?: number;
  current_balance?: number;
}

export interface CreditPurchaseResponse {
  payment_url: string;
  /** Returned so the callback page can target this exact payment in `verifyPurchase`. */
  tx_ref: string;
  gateway: string;
  message: string;
}

export interface CreditVerifyResponse {
  status: 'completed' | 'pending' | 'failed' | 'not_found';
  message: string;
  point_balance: number;
}

/** @deprecated — kept for backwards compatibility */
export interface PaymentInitResponse {
  payment_url: string;
  transaction_id: string;
}
