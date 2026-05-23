'use client';

/**
 * useSearchFilters — composer for the full search filter state.
 *
 * State ownership stays here so all sub-hooks share the same values.
 * Delegates side-effects to:
 *  - useSearchUrlSync  → URL param hydration + geolocation trigger
 *  - useSearchStaticData → TanStack queries + auto-select effects
 */

import { useSearchStaticData } from '@/hooks/search/useSearchStaticData';
import { useSearchUrlSync } from '@/hooks/search/useSearchUrlSync';
import { useDebounce } from '@/hooks/useDebounce';
import type { propertyAttributesService } from '@/services/property-attributes.service';
import type { AdType, City, FacetsResponse, SearchParams } from '@/types';
import { useCallback, useMemo, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────── */

export interface SearchFiltersState {
  query: string;
  setQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  selectedCity: City | null;
  setSelectedCity: (v: City | null) => void;
  cityInput: string;
  setCityInput: (v: string) => void;
  selectedType: AdType | null;
  setSelectedType: (v: AdType | null) => void;
  selectedQuarter: string;
  setSelectedQuarter: (v: string) => void;
  bedrooms: number | undefined;
  setBedrooms: (v: number | undefined) => void;
  bathrooms: number | undefined;
  setBathrooms: (v: number | undefined) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  surfaceRange: [number, number];
  setSurfaceRange: (v: [number, number]) => void;
  hasParking: boolean;
  setHasParking: (v: boolean) => void;
  transactionType: 'location' | 'vente' | null;
  setTransactionType: (v: 'location' | 'vente' | null) => void;
  pricePeriod: 'mois' | 'jour' | null;
  setPricePeriod: (v: 'mois' | 'jour' | null) => void;
  has3dTour: boolean;
  setHas3dTour: (v: boolean) => void;
  selectedAmenities: string[];
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  page: number;
  setPage: (v: number) => void;
  mapStyle: 'streets' | 'satellite' | 'dark';
  setMapStyle: (v: 'streets' | 'satellite' | 'dark') => void;
  showHeatmap: boolean;
  setShowHeatmap: React.Dispatch<React.SetStateAction<boolean>>;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (v: { lat: number; lng: number } | null) => void;
  sortAnchor: HTMLElement | null;
  setSortAnchor: (v: HTMLElement | null) => void;
}

export interface SearchFiltersReturn extends SearchFiltersState {
  cities: City[];
  isCitiesLoading: boolean;
  adTypes: AdType[] | undefined;
  propertyAttributes:
    | Awaited<ReturnType<typeof propertyAttributesService.list>>
    | undefined;
  facets: FacetsResponse | undefined;
  activeFilterCount: number;
  sortLabel: string;
  clearFilters: () => void;
  buildParams: () => SearchParams;
}

/* ── Hook ──────────────────────────────────────────────────────── */

export function useSearchFilters(): SearchFiltersReturn {
  // ── State ────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [selectedType, setSelectedType] = useState<AdType | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const [bathrooms, setBathrooms] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 1000]);
  const [hasParking, setHasParking] = useState(false);
  const [transactionType, setTransactionType] = useState<
    'location' | 'vente' | null
  >(null);
  const [pricePeriod, setPricePeriod] = useState<'mois' | 'jour' | null>(null);
  const [has3dTour, setHas3dTour] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>(
    'streets'
  );
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  // ── URL sync + geolocation ───────────────────────────────────
  useSearchUrlSync(
    {
      query,
      selectedCity,
      selectedType,
      selectedQuarter,
      bedrooms,
      sortBy,
      userLocation,
      surfaceRange,
    },
    {
      setQuery,
      setPage,
      setCityInput,
      setBedrooms,
      setPriceRange,
      setSelectedQuarter,
      setHasParking,
      setTransactionType,
      setPricePeriod,
      setSelectedAmenities,
      setSurfaceRange,
      setUserLocation,
      setSortBy,
      setSortOrder,
    }
  );

  // ── Debounced values for API calls (sliders + text query) ───
  const debouncedQuery = useDebounce(query, 300);
  const debouncedPriceRange = useDebounce(priceRange, 300);
  const debouncedSurfaceRange = useDebounce(surfaceRange, 300);

  // ── Remote data + auto-select ────────────────────────────────
  const { cities, isCitiesLoading, adTypes, propertyAttributes, facets } =
    useSearchStaticData(
      cityInput,
      selectedCity,
      selectedType,
      setSelectedCity,
      setCityInput,
      setSelectedType
    );

  // ── buildParams ──────────────────────────────────────────────
  const buildParams = useCallback(
    (): SearchParams => ({
      q: debouncedQuery || undefined,
      city: selectedCity?.name || cityInput.trim() || undefined,
      quarter: selectedQuarter || undefined,
      type_id: selectedType?.id || undefined,
      type: selectedType?.id ? undefined : selectedType?.name || undefined,
      bedrooms: bedrooms || undefined,
      bathrooms: bathrooms || undefined,
      price_min:
        debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
      price_max:
        debouncedPriceRange[1] < 5000000 ? debouncedPriceRange[1] : undefined,
      surface_min:
        debouncedSurfaceRange[0] > 0 ? debouncedSurfaceRange[0] : undefined,
      surface_max:
        debouncedSurfaceRange[1] < 1000 ? debouncedSurfaceRange[1] : undefined,
      has_parking: hasParking || undefined,
      transaction_type: transactionType || undefined,
      price_period: pricePeriod || undefined,
      has_3d_tour: has3dTour || undefined,
      attributes: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      latitude:
        sortBy === '_geoPoint' && userLocation ? userLocation.lat : undefined,
      longitude:
        sortBy === '_geoPoint' && userLocation ? userLocation.lng : undefined,
      sort: sortBy,
      order: sortOrder,
      page,
      per_page: 20,
    }),
    [
      debouncedQuery,
      selectedCity,
      cityInput,
      selectedQuarter,
      selectedType,
      bedrooms,
      bathrooms,
      debouncedPriceRange,
      debouncedSurfaceRange,
      hasParking,
      transactionType,
      pricePeriod,
      has3dTour,
      selectedAmenities,
      sortBy,
      sortOrder,
      userLocation,
      page,
    ]
  );

  // ── Derived ──────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedCity(null);
    setCityInput('');
    setSelectedType(null);
    setSelectedQuarter('');
    setBedrooms(undefined);
    setPriceRange([0, 5000000]);
    setSurfaceRange([0, 1000]);
    setHasParking(false);
    setTransactionType(null);
    setPricePeriod(null);
    setHas3dTour(false);
    setBathrooms(undefined);
    setSelectedAmenities([]);
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(
    () =>
      [
        selectedCity,
        selectedType,
        selectedQuarter,
        bedrooms,
        bathrooms,
        priceRange[0] > 0,
        priceRange[1] < 5000000,
        surfaceRange[0] > 0,
        surfaceRange[1] < 1000,
        hasParking,
        transactionType,
        pricePeriod,
        has3dTour,
        ...selectedAmenities,
      ].filter(Boolean).length,
    [
      selectedCity,
      selectedType,
      selectedQuarter,
      bedrooms,
      bathrooms,
      priceRange,
      surfaceRange,
      hasParking,
      transactionType,
      pricePeriod,
      has3dTour,
      selectedAmenities,
    ]
  );

  const sortLabel = useMemo(
    () =>
      sortBy === 'boost_score'
        ? 'Pertinence'
        : sortBy === 'price' && sortOrder === 'asc'
          ? 'Prix ↑'
          : sortBy === 'price' && sortOrder === 'desc'
            ? 'Prix ↓'
            : sortBy === 'surface_area' && sortOrder === 'asc'
              ? 'Surface ↑'
              : sortBy === 'surface_area' && sortOrder === 'desc'
                ? 'Surface ↓'
                : sortBy === 'reviews_avg_rating'
                  ? 'Mieux notés'
                  : sortBy === '_geoPoint'
                    ? 'Distance'
                    : sortBy === 'views_count'
                      ? 'Populaires'
                      : 'Plus récents',
    [sortBy, sortOrder]
  );

  return {
    query,
    setQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedCity,
    setSelectedCity,
    cityInput,
    setCityInput,
    selectedType,
    setSelectedType,
    selectedQuarter,
    setSelectedQuarter,
    bedrooms,
    setBedrooms,
    bathrooms,
    setBathrooms,
    priceRange,
    setPriceRange,
    surfaceRange,
    setSurfaceRange,
    hasParking,
    setHasParking,
    transactionType,
    setTransactionType,
    pricePeriod,
    setPricePeriod,
    has3dTour,
    setHas3dTour,
    selectedAmenities,
    setSelectedAmenities,
    page,
    setPage,
    mapStyle,
    setMapStyle,
    showHeatmap,
    setShowHeatmap,
    userLocation,
    setUserLocation,
    sortAnchor,
    setSortAnchor,
    cities,
    isCitiesLoading,
    adTypes,
    propertyAttributes,
    facets,
    activeFilterCount,
    sortLabel,
    clearFilters,
    buildParams,
  };
}
