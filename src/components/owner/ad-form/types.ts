import type { TourHotspot } from '@/types';

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
  attributes: string[];
  deposit_amount: string;
  minimum_lease_duration: string;
  charges_forfaitaires: boolean;
  charges_montant_forfait: string;
  charges_eau: string;
  charges_electricite: string;
  charges_autres: string;
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

export type AttributeOption = { value: string; label: string; group: string; icon?: string };

export type UpdateFn = (field: keyof AdFormValues, value: AdFormValues[keyof AdFormValues]) => void;

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
  latitude: 4.0511,
  longitude: 9.7679,
  quarter_id: '',
  type_id: '',
  attributes: [],
  deposit_amount: '',
  minimum_lease_duration: '',
  charges_forfaitaires: false,
  charges_montant_forfait: '',
  charges_eau: '',
  charges_electricite: '',
  charges_autres: '',
  distance_main_road_m: '',
  distance_shops_m: '',
  distance_transport_m: '',
  distance_school_m: '',
  distance_hospital_m: '',
};
