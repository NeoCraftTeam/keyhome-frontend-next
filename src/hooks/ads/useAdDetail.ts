'use client';

/**
 * useAdDetail — ad fetch, cache invalidation, view tracking, slug canonicalization.
 *
 * Owns:
 *  - The TanStack Query for the ad resource
 *  - Post-payment cache invalidation (kh_just_unlocked sessionStorage)
 *  - View-count tracking (once per mount)
 *  - Auto-canonicalize UUID → human slug via router.replace
 *  - Sanctum token hydration guard (prevents guest-flash on refresh)
 *  - Recently viewed + analytics tracking on load
 */

import { adsService } from '@/services/ads.service';
import type { Ad } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface UseAdDetailReturn {
  ad: Ad | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useAdDetail(adSlug: string): UseAdDetailReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { addRecentlyViewed } = useRecentlyViewed();
  const { track } = useAnalytics();

  const refreshedRef = useRef(false);
  const viewTrackedRef = useRef(false);

  // Prevent guest-flash when token exists but AuthProvider hasn't hydrated yet
  const [hasStoredSanctumToken, setHasStoredSanctumToken] = useState<
    boolean | null
  >(null);
  useEffect(() => {
    try {
      setHasStoredSanctumToken(!!localStorage.getItem('kh_sanctum_token'));
    } catch {
      setHasStoredSanctumToken(false);
    }
  }, []);

  // Post-payment cache invalidation via sessionStorage signal
  useEffect(() => {
    if (!adSlug || refreshedRef.current) return;
    if (sessionStorage.getItem('kh_just_unlocked') === adSlug) {
      refreshedRef.current = true;
      sessionStorage.removeItem('kh_just_unlocked');
      void queryClient.invalidateQueries({
        queryKey: ['ad', adSlug, isAuthenticated],
      });
    }
  }, [adSlug, isAuthenticated, queryClient]);

  // View tracking — once per mount, fires immediately (no auth required)
  useEffect(() => {
    if (adSlug && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      adsService.trackView(adSlug);
    }
  }, [adSlug]);

  const {
    data: ad,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['ad', adSlug, isAuthenticated],
    queryFn: () => adsService.show(adSlug),
    enabled:
      !!adSlug &&
      hasStoredSanctumToken !== null &&
      !isAuthLoading &&
      (isAuthenticated || !hasStoredSanctumToken),
  });

  // Slug canonicalization: UUID → human slug (after payment redirect)
  useEffect(() => {
    if (ad?.slug && adSlug !== ad.slug) {
      router.replace(`/ads/${ad.slug}`);
    }
  }, [ad, adSlug, router]);

  // Analytics + recently viewed
  useEffect(() => {
    if (!ad) return;
    addRecentlyViewed(ad);
    track('ad_view', {
      ad_id: ad.id,
      city: ad.quarter?.city_name ?? '',
      type: ad.type?.name ?? '',
      price: ad.price ?? 0,
      has_3d_tour: ad.has_3d_tour ? 1 : 0,
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kh-ad-viewed'));
    }
  }, [ad, addRecentlyViewed, track]);

  return { ad, isLoading, isError, refetch: () => void refetch() };
}
