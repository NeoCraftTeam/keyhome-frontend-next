'use client';

import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import type { AdType, City, FacetsResponse, SearchParams } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

/* ── Types ───────────────────────────────────────────────────── */

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
  /* ── Derived data ──────────────────────────────────────────── */
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

/* ── Hook ────────────────────────────────────────────────────── */

export function useSearchFilters(): SearchFiltersReturn {
  const searchParams = useSearchParams();

  /* ── Local state ───────────────────────────────────────────── */
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityInput, setCityInput] = useState(searchParams.get('city') || '');
  const [debouncedCityInput, setDebouncedCityInput] = useState(
    searchParams.get('city') || ''
  );
  const [selectedType, setSelectedType] = useState<AdType | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState(
    searchParams.get('quarter') || ''
  );
  const [bedrooms, setBedrooms] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [surfaceRange, setSurfaceRange] = useState<[number, number]>([0, 1000]);
  const [bathrooms, setBathrooms] = useState<number | undefined>();
  const [hasParking, setHasParking] = useState(false);
  const [transactionType, setTransactionType] = useState<
    'location' | 'vente' | null
  >(null);
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

  /* ── City input debounce ───────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCityInput(cityInput), 300);
    return () => clearTimeout(timer);
  }, [cityInput]);

  /* ── Geolocation for distance sort ─────────────────────────── */
  useEffect(() => {
    if (
      sortBy === '_geoPoint' &&
      !userLocation &&
      typeof navigator !== 'undefined' &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => {
          setSortBy('created_at');
          setSortOrder('desc');
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  /* ── URL → state sync ──────────────────────────────────────── */
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== query) {
      setQuery(urlQ);
      setPage(1);
    }

    const urlCity = searchParams.get('city') || '';
    if (urlCity && !selectedCity) {
      setCityInput(urlCity);
    }

    const urlBedrooms = searchParams.get('bedrooms');
    if (urlBedrooms && !bedrooms) {
      setBedrooms(Number(urlBedrooms));
    }

    const urlPriceMin = searchParams.get('price_min');
    const urlPriceMax = searchParams.get('price_max');
    if (urlPriceMin || urlPriceMax) {
      setPriceRange([
        urlPriceMin ? Number(urlPriceMin) : 0,
        urlPriceMax ? Number(urlPriceMax) : 5000000,
      ]);
    }

    const urlQuarter = searchParams.get('quarter') || '';
    if (urlQuarter !== selectedQuarter) setSelectedQuarter(urlQuarter);

    if (searchParams.get('parking') === '1') {
      setHasParking(true);
    }

    const urlTxType = searchParams.get('transaction_type');
    if (urlTxType === 'location' || urlTxType === 'vente') {
      setTransactionType(urlTxType);
    }

    if (searchParams.get('furnished') === '1') {
      setSelectedAmenities((prev) =>
        prev.includes('furnished') ? prev : [...prev, 'furnished']
      );
    }

    const urlSurfaceMin = searchParams.get('surface_min');
    if (urlSurfaceMin) {
      const min = Number(urlSurfaceMin);
      setSurfaceRange((prev) => [min, prev[1]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Remote data ───────────────────────────────────────────── */
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['cities', debouncedCityInput],
    queryFn: () => citiesService.list({ q: debouncedCityInput, per_page: 20 }),
    enabled: debouncedCityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adTypes } = useQuery({
    queryKey: ['adTypes'],
    queryFn: () => adTypesService.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: propertyAttributes } = useQuery({
    queryKey: ['property-attributes-grouped'],
    queryFn: () => propertyAttributesService.list(),
    staleTime: 30 * 60 * 1000,
  });

  const { data: facets } = useQuery<FacetsResponse>({
    queryKey: ['facets'],
    queryFn: () => adsService.facets(),
    staleTime: 5 * 60 * 1000,
  });

  /* ── Auto-select city from URL ─────────────────────────────── */
  useEffect(() => {
    const urlCity = searchParams.get('city') || '';
    if (urlCity && !selectedCity && citiesData?.data?.length) {
      const match = citiesData.data.find(
        (c) => c.name.toLowerCase() === urlCity.toLowerCase()
      );
      if (match) {
        setSelectedCity(match);
        setCityInput(match.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesData]);

  /* ── Auto-select type from URL ─────────────────────────────── */
  useEffect(() => {
    if (!adTypes?.length || selectedType) return;
    const urlTypeId = searchParams.get('type_id');
    const urlType = searchParams.get('type') || '';
    const match = urlTypeId
      ? adTypes.find((t) => String(t.id) === urlTypeId)
      : adTypes.find((t) => t.name.toLowerCase() === urlType.toLowerCase());
    if (match) setSelectedType(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adTypes]);

  /* ── Build search params ───────────────────────────────────── */
  const buildParams = useCallback(
    (): SearchParams => ({
      q: query || undefined,
      city: selectedCity?.name || cityInput.trim() || undefined,
      quarter: selectedQuarter || undefined,
      type_id: selectedType?.id || undefined,
      type: selectedType?.id ? undefined : selectedType?.name || undefined,
      bedrooms: bedrooms || undefined,
      bathrooms: bathrooms || undefined,
      price_min: priceRange[0] > 0 ? priceRange[0] : undefined,
      price_max: priceRange[1] < 5000000 ? priceRange[1] : undefined,
      surface_min: surfaceRange[0] > 0 ? surfaceRange[0] : undefined,
      surface_max: surfaceRange[1] < 1000 ? surfaceRange[1] : undefined,
      has_parking: hasParking || undefined,
      transaction_type: transactionType || undefined,
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
      query,
      selectedCity,
      cityInput,
      selectedQuarter,
      selectedType,
      bedrooms,
      bathrooms,
      priceRange,
      surfaceRange,
      hasParking,
      transactionType,
      has3dTour,
      selectedAmenities,
      sortBy,
      sortOrder,
      userLocation,
      page,
    ]
  );

  /* ── Derived ───────────────────────────────────────────────── */
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

  const cities = citiesData?.data || [];

  return {
    // State + setters
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
    // Remote data
    cities,
    isCitiesLoading,
    adTypes,
    propertyAttributes,
    facets,
    // Derived
    activeFilterCount,
    sortLabel,
    clearFilters,
    buildParams,
  };
}
