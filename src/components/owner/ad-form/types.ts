import type { TourHotspot } from '@/types';

/** Defaults for map picker / preview — keep in sync with `AdFormMapLocation` */
export const AD_FORM_MAP_DEFAULT_LAT = 4.0511;
export const AD_FORM_MAP_DEFAULT_LNG = 9.7679;

export interface ChargeItem {
  label: string;
  amount: string;
  period: 'monthly' | 'yearly';
}

export interface AdFormValues {
  title: string;
  description: string;
  adresse: string;
  price: string;
  surface_area: string;
  bedrooms: string;
  bathrooms: string;
  has_parking: boolean;
  latitude: number;
  longitude: number;
  quarter_id: string;
  type_id: string;
  transaction_type: string;
  price_period: 'mois' | 'jour';
  attributes: string[];
  deposit_amount: string;
  minimum_lease_duration: string;
  charges_forfaitaires: boolean;
  charges_montant_forfait: string;
  charges_eau: string;
  charges_electricite: string;
  charges_autres: string;
  charges_autres_items: ChargeItem[];
  is_boost_requested?: boolean;
  distance_main_road_m: string;
  distance_shops_m: string;
  distance_transport_m: string;
  distance_school_m: string;
  distance_hospital_m: string;
}

export interface TourScene {
  id?: string;
  title: string;
  file: File | null;
  previewUrl: string;
  hotspots: TourHotspot[];
}

export type AttributeOption = {
  value: string;
  label: string;
  group: string;
  icon?: string;
};

export type UpdateFn = (
  field: keyof AdFormValues,
  value: AdFormValues[keyof AdFormValues]
) => void;

export const sectionSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
} as const;

export const sectionTitleSx = {
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 2,
} as const;

export const initialValues: AdFormValues = {
  title: '',
  description: '',
  adresse: '',
  price: '',
  surface_area: '',
  bedrooms: '0',
  bathrooms: '0',
  has_parking: false,
  latitude: AD_FORM_MAP_DEFAULT_LAT,
  longitude: AD_FORM_MAP_DEFAULT_LNG,
  quarter_id: '',
  type_id: '',
  transaction_type: 'location',
  price_period: 'mois',
  attributes: [],
  deposit_amount: '',
  minimum_lease_duration: '',
  charges_forfaitaires: false,
  charges_montant_forfait: '',
  charges_eau: '',
  charges_electricite: '',
  charges_autres: '',
  charges_autres_items: [],
  distance_main_road_m: '',
  distance_shops_m: '',
  distance_transport_m: '',
  distance_school_m: '',
  distance_hospital_m: '',
};

/** Coerce nullable API / draft fields to safe form strings. */
export function adFormText(value: string | null | undefined): string {
  return value ?? '';
}

/** String fields on {@link AdFormValues} that may be null in API / draft payloads. */
export const AD_FORM_STRING_FIELD_KEYS = [
  'title',
  'description',
  'adresse',
  'price',
  'surface_area',
  'bedrooms',
  'bathrooms',
  'quarter_id',
  'type_id',
  'transaction_type',
  'deposit_amount',
  'minimum_lease_duration',
  'charges_montant_forfait',
  'charges_eau',
  'charges_electricite',
  'charges_autres',
  'distance_main_road_m',
  'distance_shops_m',
  'distance_transport_m',
  'distance_school_m',
  'distance_hospital_m',
] as const satisfies readonly (keyof AdFormValues)[];

const adFormStringFieldSet = new Set<string>(AD_FORM_STRING_FIELD_KEYS);

/** True when the coerced form text is empty after trim. */
export function isAdFormTextEmpty(value: string | null | undefined): boolean {
  return adFormText(value).trim().length === 0;
}

/** Coerce a single field update so string fields never become null at runtime. */
export function coerceAdFormFieldValue<K extends keyof AdFormValues>(
  field: K,
  value: AdFormValues[K]
): AdFormValues[K] {
  if (
    adFormStringFieldSet.has(field) &&
    (typeof value === 'string' || value === null || value === undefined)
  ) {
    return adFormText(value as string | null | undefined) as AdFormValues[K];
  }

  return value;
}

/**
 * Merge partial ad form state with defaults and coerce nullish API values.
 * Prevents runtime crashes (e.g. `.trim()` on null) in preview & validation.
 */
export function normalizeAdFormValues(
  partial?: Partial<AdFormValues> | null
): AdFormValues {
  const merged = { ...initialValues, ...(partial ?? {}) };

  const lat =
    typeof merged.latitude === 'number' && !Number.isNaN(merged.latitude)
      ? merged.latitude
      : AD_FORM_MAP_DEFAULT_LAT;
  const lng =
    typeof merged.longitude === 'number' && !Number.isNaN(merged.longitude)
      ? merged.longitude
      : AD_FORM_MAP_DEFAULT_LNG;

  return {
    ...merged,
    title: adFormText(merged.title),
    description: adFormText(merged.description),
    adresse: adFormText(merged.adresse),
    price: adFormText(merged.price),
    surface_area: adFormText(merged.surface_area),
    bedrooms: adFormText(merged.bedrooms) || '0',
    bathrooms: adFormText(merged.bathrooms) || '0',
    quarter_id: adFormText(merged.quarter_id),
    type_id: adFormText(merged.type_id),
    transaction_type: adFormText(merged.transaction_type) || 'location',
    price_period: merged.price_period === 'jour' ? 'jour' : 'mois',
    attributes: Array.isArray(merged.attributes) ? merged.attributes : [],
    deposit_amount: adFormText(merged.deposit_amount),
    minimum_lease_duration: adFormText(merged.minimum_lease_duration),
    charges_montant_forfait: adFormText(merged.charges_montant_forfait),
    charges_eau: adFormText(merged.charges_eau),
    charges_electricite: adFormText(merged.charges_electricite),
    charges_autres: adFormText(merged.charges_autres),
    charges_autres_items: Array.isArray(merged.charges_autres_items)
      ? merged.charges_autres_items
      : [],
    distance_main_road_m: adFormText(merged.distance_main_road_m),
    distance_shops_m: adFormText(merged.distance_shops_m),
    distance_transport_m: adFormText(merged.distance_transport_m),
    distance_school_m: adFormText(merged.distance_school_m),
    distance_hospital_m: adFormText(merged.distance_hospital_m),
    has_parking: Boolean(merged.has_parking),
    charges_forfaitaires: Boolean(merged.charges_forfaitaires),
    latitude: lat,
    longitude: lng,
  };
}
