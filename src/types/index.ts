// ============================================================
// KeyHome - TypeScript type definitions matching Laravel backend
// ============================================================

// --- Enums ---

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  CUSTOMER = 'customer',
}

export enum UserType {
  INDIVIDUAL = 'individual',
  AGENCY = 'agency',
}

export enum AdStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  RENT = 'rent',
  PENDING = 'pending',
  SOLD = 'sold',
  DECLINED = 'declined',
}

export enum PropertyAttribute {
  Wifi = 'wifi',
  AirConditioning = 'air_conditioning',
  Heating = 'heating',
  PetsAllowed = 'pets_allowed',
  Furnished = 'furnished',
  Pool = 'pool',
  Garden = 'garden',
  Balcony = 'balcony',
  Terrace = 'terrace',
  Elevator = 'elevator',
  Security = 'security',
  Gym = 'gym',
  Laundry = 'laundry',
  Storage = 'storage',
  Fireplace = 'fireplace',
  Dishwasher = 'dishwasher',
  WashingMachine = 'washing_machine',
  Tv = 'tv',
  Accessibility = 'accessibility',
  SmokingAllowed = 'smoking_allowed',
}

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

// --- Models ---

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  phone_number?: string | null;
  phone_is_whatsapp?: boolean | null;
  email?: string;
  avatar: string | null;
  display_name: string;
  name?: string;
  agency_name: string | null;
  role?: UserRole | null;
  type?: UserType | null;
  created_at?: string | null;
  updated_at?: string | null;
  city_id: string | null;
  city_name: string | null;
  point_balance?: number;
  onboarding_completed_at?: string | null;
}

export interface City {
  id: string;
  name: string;
}

export interface Quarter {
  id: string;
  name: string;
  city_id: string;
  city_name: string;
}

export interface AdType {
  id: string;
  name: string;
  desc: string;
}

export interface AdImage {
  id: number;
  url: string;
  placeholder: string | null;
  thumb: string;
  large: string;
  mime_type: string;
  is_primary: boolean;
}

export interface TourHotspot {
  pitch: number;
  yaw: number;
  target_scene: string;
  label: string;
  type?: 'scene';
}

export interface TourScene {
  id: string;
  title: string;
  type?: 'equirectangular' | 'cubemap' | 'multires';
  image_url?: string;
  initial_view: { pitch: number; yaw: number; hfov: number };
  hotspots: TourHotspot[];
  /** Cubemap: 6 proxy URLs in Pannellum order [f, r, b, l, u, d] */
  cube_map?: string[];
  /** Multires tile pyramid base URL (up to the /tiles segment) */
  tiles_base_url?: string;
  /** Multires fallback low-res faces base URL */
  fallback_base_url?: string;
  tiles_max_level?: number;
  cube_resolution?: number;
  /** True while the background conversion job is running */
  processing?: boolean;
  processing_failed?: boolean;
}

export interface TourConfig {
  default_scene: string;
  scenes: TourScene[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Ad {
  id: string;
  title: string;
  slug: string;
  description: string;
  adresse: string;
  price: number | null;
  surface_area: number;
  bedrooms: number;
  bathrooms: number;
  has_parking: boolean;
  location: GeoLocation | null;
  status: AdStatus;
  status_label?: string;
  is_unlocked?: boolean;
  unlock_cost?: number;
  has_3d_tour?: boolean;
  tour_config?: TourConfig | null;
  tour_scenes_count?: number;
  tour_published_at?: string | null;
  total_images?: number;
  is_favorited?: boolean;
  view_count?: number;
  rating?: number | null;
  reviews_count?: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user: User | null;
  agency: Agency | null;
  published_by: string;
  quarter: Quarter | null;
  type: AdType | null;
  images: AdImage[];
  reviews?: Review[];
  distance?: number;
  // Availability & Attributes
  is_visible?: boolean;
  available_from?: string | null;
  available_to?: string | null;
  attributes?: string[];
  is_currently_available?: boolean;
  // Premium info (only when unlocked)
  deposit_amount?: string | null;
  minimum_lease_duration?: string | null;
  detailed_charges?: string | null;
  property_condition_pdf?: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { id: string; name: string; avatar: string | null } | null;
  created_at: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
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
  ad?: Ad;
  payment?: Payment;
}

// --- API Response types ---

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

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
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

/** Returned by POST /payments/initialize/:adId */
export interface UnlockResponse {
  status: 'unlocked' | 'insufficient_points' | 'owner' | 'already_unlocked';
  message?: string;
  points_used?: number;
  points_balance?: number;
  /** Returned when status === 'insufficient_points' */
  packages?: PointPackage[];
  required_points?: number;
  current_balance?: number;
}

/** Returned by POST /credits/purchase/:packageId */
export interface CreditPurchaseResponse {
  payment_url: string;
  message: string;
}

/** Returned by POST /credits/verify-purchase */
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

// =====================================================
// Viewing / Appointment booking
// =====================================================

export enum ReservationStatus {
  Pending   = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Expired   = 'expired',
}

export enum CancelledBy {
  Client   = 'client',
  Landlord = 'landlord',
  System   = 'system',
}

export interface BookableSlot {
  starts_at: string;   // "HH:MM"
  ends_at: string;     // "HH:MM"
  is_available: boolean;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  status_label: string;
  slot_date: string;          // "YYYY-MM-DD"
  slot_starts_at: string;     // "HH:MM:SS"
  slot_ends_at: string;       // "HH:MM:SS"
  client_message: string | null;
  landlord_notes: string | null;
  cancelled_by: CancelledBy | null;
  cancellation_reason: string | null;
  expires_at: string;         // ISO 8601
  created_at: string;
  updated_at: string;
  ad?: Ad;
  client?: User;
  next_steps?: string;
}

export interface CreateReservationPayload {
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
  client_message?: string;
}

export interface SlotsResponse {
  date: string;
  slots: BookableSlot[];
}

// =====================================================

export interface AutocompleteResult {
  value: string;
  count: number;
}

export interface FacetsResponse {
  cities: { name: string; count: number }[];
  types: { name: string; count: number }[];
  bedrooms: { value: number; count: number }[];
  price_range: { min: number; max: number };
  surface_range: { min: number; max: number };
  has_parking: { with_parking: number; without_parking: number };
}

export interface SearchParams {
  q?: string;
  city?: string;
  type?: string;
  quarter?: string;
  bedrooms?: number;
  price_min?: number;
  price_max?: number;
  surface_min?: number;
  surface_max?: number;
  has_parking?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

// --- Survey Types ---

export type QuestionType = 'multiple_choice' | 'checkbox' | 'rating' | 'text';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[] | null;
  order: number;
}

export interface Survey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questions: SurveyQuestion[];
}

export interface PublicSurvey {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  is_public: boolean;
  already_submitted: boolean;
  questions_count?: number;
  questions: SurveyQuestion[];
}

export interface SurveyAnswerPayload {
  question_id: string;
  answer: string | string[] | number;
}
