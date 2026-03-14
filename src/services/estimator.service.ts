import api from '@/lib/api';

export interface RentEstimateParams {
  city_id: string;
  type_id: string;
  surface: number;
  bedrooms?: number;
}

export interface RentEstimateResult {
  estimated_min: number;
  estimated_median: number;
  estimated_max: number;
  price_per_sqm: { p25: number; p50: number; p75: number };
  sample_count: number;
  surface: number;
  error?: string;
}

export interface HeatmapFeature {
  quarter_id: string;
  quarter_name: string;
  city_name: string;
  lat: number;
  lng: number;
  ad_count: number;
  avg_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  intensity: number;
}

export interface HeatmapResult {
  features: HeatmapFeature[];
  price_range: { min: number; max: number };
}

export interface KeyScoreBreakdownItem {
  score: number;
  max: number;
  label: string;
  value: string;
}

export interface KeyScoreResult {
  score: number;
  label: string;
  breakdown: Record<string, KeyScoreBreakdownItem>;
}

export const estimatorService = {
  estimate: (params: RentEstimateParams): Promise<RentEstimateResult> =>
    api.get('/rent-estimate', { params }).then((r) => r.data),
};

export const heatmapService = {
  get: (cityId?: string, typeId?: string): Promise<HeatmapResult> =>
    api.get('/price-heatmap', { params: { city_id: cityId, type_id: typeId } }).then((r) => r.data),
};

export const keyScoreService = {
  get: (adId: string): Promise<KeyScoreResult> =>
    api.get(`/ads/${adId}/keyscore`).then((r) => r.data),
};
