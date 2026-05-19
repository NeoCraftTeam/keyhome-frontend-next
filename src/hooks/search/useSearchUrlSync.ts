'use client';

/**
 * useSearchUrlSync — hydrates filter state from URL search params.
 *
 * Owns:
 *  - Initial hydration from URL on mount
 *  - Re-sync on URL changes (Next.js navigation, browser back/forward)
 *  - Geolocation request when sort switches to `_geoPoint`
 *
 * Receives all setters so it can update parent state without owning it.
 * This is intentional: state lives in the composer (useSearchFilters) so
 * all sub-hooks share the same values without prop-drilling.
 */

import type { AdType, City } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface UrlSyncSetters {
  setQuery: (v: string) => void;
  setPage: (v: number) => void;
  setCityInput: (v: string) => void;
  setBedrooms: (v: number | undefined) => void;
  setPriceRange: (v: [number, number]) => void;
  setSelectedQuarter: (v: string) => void;
  setHasParking: (v: boolean) => void;
  setTransactionType: (v: 'location' | 'vente' | null) => void;
  setPricePeriod: (v: 'mois' | 'jour' | null) => void;
  setSelectedAmenities: React.Dispatch<React.SetStateAction<string[]>>;
  setSurfaceRange: (v: [number, number]) => void;
  setUserLocation: (v: { lat: number; lng: number } | null) => void;
  setSortBy: (v: string) => void;
  setSortOrder: (v: 'asc' | 'desc') => void;
}

interface UrlSyncCurrentValues {
  query: string;
  selectedCity: City | null;
  selectedType: AdType | null;
  selectedQuarter: string;
  bedrooms: number | undefined;
  sortBy: string;
  userLocation: { lat: number; lng: number } | null;
  surfaceRange: [number, number];
}

export function useSearchUrlSync(
  current: UrlSyncCurrentValues,
  setters: UrlSyncSetters
): void {
  const searchParams = useSearchParams();
  const {
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
  } = setters;

  // URL → state sync on every navigation change
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== current.query) {
      setQuery(urlQ);
      setPage(1);
    }

    const urlCity = searchParams.get('city') || '';
    if (urlCity && !current.selectedCity) {
      setCityInput(urlCity);
    }

    const urlBedrooms = searchParams.get('bedrooms');
    if (urlBedrooms && !current.bedrooms) {
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
    if (urlQuarter !== current.selectedQuarter) setSelectedQuarter(urlQuarter);

    if (searchParams.get('parking') === '1') setHasParking(true);

    const urlTxType = searchParams.get('transaction_type');
    if (urlTxType === 'location' || urlTxType === 'vente')
      setTransactionType(urlTxType);

    const urlPricePeriod = searchParams.get('price_period');
    if (urlPricePeriod === 'mois' || urlPricePeriod === 'jour')
      setPricePeriod(urlPricePeriod);

    if (searchParams.get('furnished') === '1') {
      setSelectedAmenities((prev) =>
        prev.includes('furnished') ? prev : [...prev, 'furnished']
      );
    }

    const urlSurfaceMin = searchParams.get('surface_min');
    if (urlSurfaceMin) {
      const min = Number(urlSurfaceMin);
      setSurfaceRange([min, current.surfaceRange[1]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Geolocation for distance sort
  useEffect(() => {
    if (
      current.sortBy === '_geoPoint' &&
      !current.userLocation &&
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
  }, [current.sortBy]);
}
