// @ts-strict
import type { AdFormValues } from './types';

export enum AdTypeCategory {
  RESIDENTIAL = 'RESIDENTIAL',
  TERRAIN = 'TERRAIN',
  VEHICLE = 'VEHICLE',
  COMMERCIAL = 'COMMERCIAL',
}

export enum TransactionType {
  LOCATION = 'location',
  VENTE = 'vente',
}

export interface AdTypeCategoryConfig {
  id: AdTypeCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  subtypes: string[];
  available: boolean;
  requiredFields: (keyof AdFormValues)[];
  hiddenFields: (keyof AdFormValues)[];
}

const RESIDENTIAL_SUBTYPES: string[] = [
  'chambre simple',
  'chambre meublée',
  'studio simple',
  'studio meublé',
  'appartement simple',
  'appartement meublé',
  'maison',
];

const RESIDENTIAL_REQUIRED_FIELDS: (keyof AdFormValues)[] = [
  'title',
  'description',
  'adresse',
  'price',
  'surface_area',
  'bedrooms',
  'bathrooms',
  'quarter_id',
  'type_id',
];

const RESIDENTIAL_SPECIFIC_FIELDS: (keyof AdFormValues)[] = [
  'bedrooms',
  'bathrooms',
  'has_parking',
  'deposit_amount',
  'minimum_lease_duration',
  'charges_forfaitaires',
  'charges_montant_forfait',
  'charges_eau',
  'charges_electricite',
  'charges_autres',
  'charges_autres_items',
  'surface_area',
  'quarter_id',
  'type_id',
  'latitude',
  'longitude',
  'attributes',
  'distance_main_road_m',
  'distance_shops_m',
  'distance_transport_m',
  'distance_school_m',
  'distance_hospital_m',
];

export const AD_TYPE_CATEGORIES: AdTypeCategoryConfig[] = [
  {
    id: AdTypeCategory.RESIDENTIAL,
    label: 'Résidentiel',
    description: 'Appartements, studios, chambres, maisons',
    icon: 'Home',
    color: '#4CAF50',
    subtypes: RESIDENTIAL_SUBTYPES,
    available: true,
    requiredFields: RESIDENTIAL_REQUIRED_FIELDS,
    hiddenFields: [],
  },
  {
    id: AdTypeCategory.TERRAIN,
    label: 'Terrain',
    description: 'Terrains à vendre ou à louer',
    icon: 'Landscape',
    color: '#FF9800',
    subtypes: ['terrain'],
    available: true,
    requiredFields: [
      'title',
      'description',
      'adresse',
      'price',
      'surface_area',
      'quarter_id',
      'type_id',
    ],
    hiddenFields: [
      'bedrooms',
      'bathrooms',
      'has_parking',
      'deposit_amount',
      'minimum_lease_duration',
      'charges_forfaitaires',
      'charges_montant_forfait',
      'charges_eau',
      'charges_electricite',
      'charges_autres',
      'charges_autres_items',
    ],
  },
  {
    id: AdTypeCategory.VEHICLE,
    label: 'Véhicule',
    description: 'Voitures, motos et utilitaires',
    icon: 'DirectionsCar',
    color: '#2196F3',
    subtypes: [],
    available: false,
    requiredFields: ['title', 'description', 'price'],
    hiddenFields: RESIDENTIAL_SPECIFIC_FIELDS,
  },
  {
    id: AdTypeCategory.COMMERCIAL,
    label: 'Commercial',
    description: 'Bureaux, boutiques, entrepôts',
    icon: 'Store',
    color: '#9C27B0',
    subtypes: [],
    available: false,
    requiredFields: [
      'title',
      'description',
      'adresse',
      'price',
      'surface_area',
      'quarter_id',
      'type_id',
    ],
    hiddenFields: ['bedrooms', 'bathrooms'],
  },
];

export function getCategoryForAdType(
  typeName: string
): AdTypeCategoryConfig | undefined {
  const normalized = typeName.toLowerCase().trim();
  return AD_TYPE_CATEGORIES.find((category) =>
    category.subtypes.includes(normalized)
  );
}

export function getCategoryById(
  categoryId: AdTypeCategory
): AdTypeCategoryConfig | undefined {
  return AD_TYPE_CATEGORIES.find((category) => category.id === categoryId);
}

export const TRANSACTION_TYPES = [
  {
    value: 'location' as const,
    label: 'Location',
    icon: 'Key',
    description: 'Mise en location',
  },
  {
    value: 'vente' as const,
    label: 'Vente',
    icon: 'Sell',
    description: 'Mise en vente',
  },
] as const;
