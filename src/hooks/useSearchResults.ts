'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adsService } from '@/services/ads.service';
import type { SearchParams } from '@/types';

interface UseSearchResultsOptions {
  buildParams: () => SearchParams;
  isMobile: boolean;
  mobileViewMode: 'list' | 'map';
}

export function useSearchResults({
  buildParams,
  isMobile,
  mobileViewMode,
}: UseSearchResultsOptions) {
  const params = buildParams();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [
      'search',
      params.q,
      params.city,
      params.type_id,
      params.quarter,
      params.bedrooms,
      params.bathrooms,
      params.price_min,
      params.price_max,
      params.surface_min,
      params.surface_max,
      params.has_parking,
      params.transaction_type,
      params.has_3d_tour,
      params.is_verified,
      params.attributes,
      params.sort,
      params.order,
      params.page,
      params.latitude,
      params.longitude,
    ],
    queryFn: () => adsService.search({ ...params, page: 1, per_page: 200 }),
    staleTime: 60 * 1000,
  });

  const { data: allAdsData } = useQuery({
    queryKey: [
      'search-map-all',
      params.q,
      params.city,
      params.type_id,
      params.quarter,
      params.transaction_type,
      params.bedrooms,
      params.bathrooms,
      params.price_min,
      params.price_max,
      params.surface_min,
      params.surface_max,
      params.has_parking,
      params.has_3d_tour,
      params.is_verified,
      params.attributes,
      params.latitude,
      params.longitude,
    ],
    queryFn: () => adsService.search({ ...params, page: 1, per_page: 200 }),
    staleTime: 2 * 60 * 1000,
    enabled: !isMobile || mobileViewMode === 'map',
  });

  const ads = useMemo(() => data?.data || [], [data?.data]);
  const mapAds = useMemo(
    () => allAdsData?.data || ads,
    [allAdsData?.data, ads]
  );
  const totalPages = data?.meta?.last_page || 1;
  const total = data?.meta?.total || 0;

  return {
    ads,
    mapAds,
    totalPages,
    total,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}
