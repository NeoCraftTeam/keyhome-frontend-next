'use client';

/**
 * useSearchStaticData — remote data for the search filter panel.
 *
 * Owns:
 *  - Cities autocomplete query (debounced input)
 *  - Ad types query
 *  - Property attributes query
 *  - Facets query
 *  - Auto-select city / type when URL params arrive before data
 */

import { adsService } from '@/services/ads.service';
import { adTypesService, citiesService } from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import type { AdType, City, FacetsResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useSearchStaticData(
  cityInput: string,
  selectedCity: City | null,
  selectedType: AdType | null,
  setSelectedCity: (v: City | null) => void,
  setCityInput: (v: string) => void,
  setSelectedType: (v: AdType | null) => void
): {
  cities: City[];
  isCitiesLoading: boolean;
  adTypes: AdType[] | undefined;
  propertyAttributes:
    | Awaited<ReturnType<typeof propertyAttributesService.list>>
    | undefined;
  facets: FacetsResponse | undefined;
} {
  const searchParams = useSearchParams();

  // Debounced city input
  const [debouncedCityInput, setDebouncedCityInput] = useState(cityInput);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCityInput(cityInput), 300);
    return () => clearTimeout(timer);
  }, [cityInput]);

  // ── Queries ──────────────────────────────────────────────────
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

  // Auto-select city from URL once cities data arrives
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

  // Auto-select type from URL once adTypes data arrives
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

  return {
    cities: citiesData?.data ?? [],
    isCitiesLoading,
    adTypes,
    propertyAttributes,
    facets,
  };
}
