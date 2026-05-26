'use client';

/**
 * useAdFormStaticData — remote data needed by all steps of AdFormWizard.
 *
 * Owns:
 *  - Cities autocomplete query (no debounce — parent manages input state)
 *  - Quarters query (depends on selected city + quarter text input)
 *  - Ad types query (cached forever, gcTime 30 min)
 *  - Property attributes query (cached forever)
 *  - Derived: cities[], quarters[], adTypes[], groupedAttrs, autocompleteOptions
 *
 * Uses the same query keys as AdFormWizard so they share the TanStack cache.
 */

import type { AttributeOption } from '@/components/owner/ad-form/types';
import {
  adTypesService,
  citiesService,
  quartersService,
} from '@/services/cities.service';
import { propertyAttributesService } from '@/services/property-attributes.service';
import type { AdType, City, Quarter } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

type GroupedAttr = {
  name?: string;
  group?: string;
  attributes?: Array<{ value: string; label: string; icon?: string }>;
};

export interface UseAdFormStaticDataReturn {
  cities: City[];
  isCitiesLoading: boolean;
  quarters: Quarter[];
  isQuartersLoading: boolean;
  isCreatingCity: boolean;
  isCreatingQuarter: boolean;
  cityCreateError: string | null;
  adTypes: AdType[];
  groupedAttrs: GroupedAttr[];
  autocompleteOptions: AttributeOption[];
  onCityCreate: (name: string) => void;
  onQuarterCreate: (name: string) => void;
}

export function useAdFormStaticData(
  cityInput: string,
  quarterInput: string,
  selectedCity: City | null,
  onCitySelected?: (city: City) => void,
  onQuarterSelected?: (quarter: Quarter) => void
): UseAdFormStaticDataReturn {
  const queryClient = useQueryClient();
  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['ad-form-cities', cityInput],
    queryFn: ({ signal }) =>
      citiesService.list({ q: cityInput, per_page: 50 }, { signal }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: quartersData, isFetching: isQuartersLoading } = useQuery({
    queryKey: ['ad-form-quarters', selectedCity?.id, quarterInput],
    queryFn: ({ signal }) =>
      quartersService.list(
        { city_id: selectedCity?.id, q: quarterInput, per_page: 50 },
        { signal }
      ),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: adTypesData } = useQuery({
    queryKey: ['ad-types'],
    queryFn: ({ signal }) => adTypesService.list({ signal }),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const { data: attrData } = useQuery({
    queryKey: ['property-attributes'],
    queryFn: ({ signal }) => propertyAttributesService.list({ signal }),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const adTypes = useMemo(() => (adTypesData ?? []) as AdType[], [adTypesData]);

  const groupedAttrs = useMemo(
    () => (attrData?.grouped ?? []) as GroupedAttr[],
    [attrData?.grouped]
  );

  const autocompleteOptions = useMemo<AttributeOption[]>(() => {
    const opts = groupedAttrs.flatMap((g) =>
      (g.attributes ?? []).map((attr) => ({
        ...attr,
        group: (g.name ?? g.group ?? 'Autre') as string,
      }))
    );
    opts.sort((a, b) => a.group.localeCompare(b.group));
    return opts;
  }, [groupedAttrs]);

  const {
    mutate: createCity,
    isPending: isCreatingCity,
    error: cityMutationError,
  } = useMutation({
    mutationFn: (name: string) => citiesService.findOrCreate({ name }),
    onSuccess: (result: { data: City; created: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['ad-form-cities'] });
      onCitySelected?.(result.data);
    },
  });

  const cityCreateError: string | null = cityMutationError
    ? ((cityMutationError as { response?: { data?: { message?: string } } })
        .response?.data?.message ?? 'Ville introuvable')
    : null;

  const { mutate: createQuarter, isPending: isCreatingQuarter } = useMutation({
    mutationFn: (name: string) =>
      quartersService.findOrCreate({ name, city_id: selectedCity!.id }),
    onSuccess: (result: { data: Quarter; created: boolean }) => {
      queryClient.invalidateQueries({
        queryKey: ['ad-form-quarters', selectedCity?.id],
      });
      onQuarterSelected?.(result.data);
    },
  });

  const onCityCreate = (name: string) => createCity(name);
  const onQuarterCreate = (name: string) => {
    if (selectedCity?.id) createQuarter(name);
  };

  return {
    cities: (citiesData?.data ?? []) as City[],
    isCitiesLoading,
    quarters: (quartersData?.data ?? []) as Quarter[],
    isQuartersLoading,
    isCreatingCity,
    isCreatingQuarter,
    cityCreateError,
    adTypes,
    groupedAttrs,
    autocompleteOptions,
    onCityCreate,
    onQuarterCreate,
  };
}
