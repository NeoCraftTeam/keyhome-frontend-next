import type { User } from './user';

export enum AdStatus {
  DRAFT = 'draft',
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

export interface GeoLocation {
  latitude: number;
  longitude: number;
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
  /** @deprecated Legacy field — use target_scene instead */
  sceneId?: string;
  /** @deprecated Legacy field — use label instead */
  text?: string;
}

export interface TourScene {
  id: string;
  title: string;
  type?: 'equirectangular' | 'cubemap' | 'multires';
  image_url?: string;
  thumbnail_url?: string;
  initial_view: { pitch: number; yaw: number; hfov: number };
  hotspots: TourHotspot[];
  cube_map?: string[];
  tiles_base_url?: string;
  fallback_base_url?: string;
  tiles_max_level?: number;
  cube_resolution?: number;
  processing?: boolean;
  processing_failed?: boolean;
  haov?: number;
  vaov?: number;
  vOffset?: number;
  is_partial_pano?: boolean;
}

export interface TourConfig {
  default_scene: string;
  scenes: TourScene[];
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { id: string; name: string; avatar: string | null } | null;
  created_at: string;
}

export interface Ad {
  id: string;
  title: string;
  slug: string;
  description: string;
  adresse: string | null;
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
  views_count_today?: number;
  views_count_week?: number;
  is_verified?: boolean;
  is_boosted?: boolean;
  boost_expires_at?: string | null;
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
  transaction_type?: 'location' | 'vente' | null;
  price_period?: 'mois' | 'jour' | null;
  images: AdImage[];
  reviews?: Review[];
  distance?: number;
  is_visible?: boolean;
  available_from?: string | null;
  available_to?: string | null;
  attributes?: string[];
  is_currently_available?: boolean;
  deposit_amount?: string | null;
  minimum_lease_duration?: string | null;
  detailed_charges?: string | null;
  property_condition_pdf?: string | null;
  charges_forfaitaires?: boolean;
  charges_montant_forfait?: string | null;
  charges_eau?: string | null;
  charges_electricite?: string | null;
  charges_autres?: string | null;
  // Proximité (mètres) — déclarées par l'annonceur
  distance_main_road_m?: number | null;
  distance_shops_m?: number | null;
  distance_transport_m?: number | null;
  distance_school_m?: number | null;
  distance_hospital_m?: number | null;
  /** Pending-edit draft — populated only for the ad owner. Non-null means unsaved changes exist. */
  draft_payload?: Record<string, unknown> | null;
}
