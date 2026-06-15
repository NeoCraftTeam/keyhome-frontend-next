import { AdStatus, type Ad, type TourHotspot } from '@/types';

/**
 * Default map position when no city/quarter coords are available yet.
 * World-neutral center (Africa/Europe meridian) — the map auto-centers
 * on the selected city or quarter's real GPS coords when available.
 */
export const AD_FORM_MAP_DEFAULT_LAT = 10.0;
export const AD_FORM_MAP_DEFAULT_LNG = 20.0;

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
    has_parking: Boolean(merged.has_parking),
    charges_forfaitaires: Boolean(merged.charges_forfaitaires),
    latitude: lat,
    longitude: lng,
  };
}

/**
 * Map an API {@link Ad} (and optional pending `draft_payload`) into wizard form values.
 * Always runs through {@link normalizeAdFormValues} so null API strings never reach `.trim()`.
 */
export function mapAdToFormValues(ad: Ad): AdFormValues {
  const draft =
    ad.status !== AdStatus.DRAFT && ad.draft_payload != null
      ? ad.draft_payload
      : null;
  const ds = (key: string): string | null | undefined => {
    const value = draft?.[key];
    if (value === null) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }

    return undefined;
  };
  const dn = (key: string): number | undefined => {
    const value = draft?.[key];
    return typeof value === 'number' ? value : undefined;
  };
  const db = (key: string): boolean | undefined => {
    const value = draft?.[key];
    return typeof value === 'boolean' ? value : undefined;
  };

  return normalizeAdFormValues({
    title: adFormText(ds('title') ?? ad.title),
    description: adFormText(ds('description') ?? ad.description),
    adresse: adFormText(ds('adresse') ?? ad.adresse),
    price: ds('price') ?? (ad.price != null ? String(ad.price) : ''),
    price_period:
      (ds('price_period') as 'mois' | 'jour' | undefined) ??
      ad.price_period ??
      'mois',
    surface_area:
      ds('surface_area') ??
      (ad.surface_area != null ? String(ad.surface_area) : ''),
    bedrooms:
      ds('bedrooms') ?? (ad.bedrooms != null ? String(ad.bedrooms) : ''),
    bathrooms:
      ds('bathrooms') ?? (ad.bathrooms != null ? String(ad.bathrooms) : ''),
    has_parking: db('has_parking') ?? ad.has_parking ?? false,
    latitude:
      dn('latitude') ?? ad.location?.latitude ?? AD_FORM_MAP_DEFAULT_LAT,
    longitude:
      dn('longitude') ?? ad.location?.longitude ?? AD_FORM_MAP_DEFAULT_LNG,
    quarter_id: ds('quarter_id') ?? ad.quarter?.id ?? '',
    type_id: ds('type_id') ?? ad.type?.id ?? '',
    transaction_type:
      (ds('transaction_type') as 'location' | 'vente' | undefined) ??
      ad.transaction_type ??
      'location',
    attributes:
      (draft?.attributes as string[] | undefined) ?? ad.attributes ?? [],
    deposit_amount: ds('deposit_amount') ?? ad.deposit_amount ?? '',
    minimum_lease_duration:
      ds('minimum_lease_duration') ?? ad.minimum_lease_duration ?? '',
    charges_forfaitaires:
      db('charges_forfaitaires') ?? !!ad.charges_forfaitaires,
    charges_montant_forfait:
      ds('charges_montant_forfait') ??
      (ad.charges_montant_forfait != null
        ? String(ad.charges_montant_forfait)
        : ''),
    charges_eau:
      ds('charges_eau') ??
      (ad.charges_eau != null ? String(ad.charges_eau) : ''),
    charges_electricite:
      ds('charges_electricite') ??
      (ad.charges_electricite != null ? String(ad.charges_electricite) : ''),
    charges_autres: ds('charges_autres') ?? ad.charges_autres ?? '',
    charges_autres_items: (ad.charges_autres ?? '')
      .split('\n')
      .filter((line: string) => line.includes(':'))
      .map((line: string) => {
        const [label, rest] = line.split(':').map((s: string) => s.trim());
        const amountMatch = rest?.match(/^([\d.]+)/);
        const isYearly = rest?.includes('/an');

        return {
          label: label ?? '',
          amount: amountMatch?.[1] ?? '',
          period: (isYearly ? 'yearly' : 'monthly') as 'monthly' | 'yearly',
        };
      })
      .filter((item) => item.label),
  });
}
