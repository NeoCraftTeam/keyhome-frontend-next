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

export type PaymentGateway = 'flutterwave';

export interface FlutterwaveInitiatePayload {
  type: 'unlock' | 'subscription' | 'credit';
  payment_method?: 'mobile_money' | 'orange_money' | 'flutterwave' | 'card';
  phone_number?: string;
  ad_id?: string | null;
  agency_id?: string | null;
  plan_id?: string | null;
  period?: 'monthly' | 'yearly' | null;
}

export interface FlutterwaveInitiateResponse {
  reference: string;
  payment_link: string;
  tx_ref: string;
  gateway: PaymentGateway;
  status: 'pending';
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
  payment_method: string | null;
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
