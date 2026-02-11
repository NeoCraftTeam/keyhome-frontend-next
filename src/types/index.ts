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
}

export enum PaymentMethod {
  ORANGE_MONEY = 'orange_money',
  MOBILE_MONEY = 'mobile_money',
  STRIPE = 'stripe',
  FEDAPAY = 'fedapay',
}

// --- Models ---

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  phone_number: string | null;
  email: string;
  avatar: string | null;
  display_name: string;
  agency_name: string | null;
  role: UserRole | null;
  type: UserType | null;
  created_at: string | null;
  updated_at: string | null;
  city_id: string | null;
  city_name: string | null;
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
  thumb: string;
  mime_type: string;
  is_primary: boolean;
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
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user: User | null;
  agency: Agency | null;
  published_by: string;
  quarter: Quarter | null;
  type: AdType | null;
  images: AdImage[];
  is_unlocked?: boolean;
  distance?: number;
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
  type: PaymentType;
  amount: number;
  transaction_id: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  user_id: string;
  ad_id: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  ad_id: string;
  user_id: string;
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

export interface PaymentInitResponse {
  payment_url: string;
  transaction_id: string;
}

export interface AutocompleteResult {
  value: string;
  count: number;
}

export interface FacetsResponse {
  cities: { value: string; count: number }[];
  types: { value: string; count: number }[];
  bedrooms: { value: number; count: number }[];
  price_range: { min: number; max: number };
  surface_range: { min: number; max: number };
  has_parking: { value: boolean; count: number }[];
}

export interface SearchParams {
  q?: string;
  city?: string;
  type?: string;
  quarter?: string;
  bedrooms?: number;
  min_price?: number;
  max_price?: number;
  min_surface?: number;
  max_surface?: number;
  has_parking?: boolean;
  page?: number;
  per_page?: number;
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
}
