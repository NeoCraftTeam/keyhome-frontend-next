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
  type_id?: string | number;
  quarter?: string;
  bedrooms?: number;
  bathrooms?: number;
  price_min?: number;
  price_max?: number;
  surface_min?: number;
  surface_max?: number;
  has_parking?: boolean;
  transaction_type?: string;
  has_3d_tour?: boolean;
  is_verified?: boolean;
  attributes?: string[];
  latitude?: number;
  longitude?: number;
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
