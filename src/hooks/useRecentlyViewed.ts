'use client';

import { adsService } from '@/services/ads.service';
import { dedupeById } from '@/lib/dedupe-by-id';
import { useAuth } from '@/providers/AuthProvider';
import { Ad } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'keyhome_recently_viewed';
const MAX_ITEMS = 10;

function readFromStorage(): Ad[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

/**
 * Tracks and retrieves recently viewed ads, persisted in localStorage.
 * For authenticated users, also fetches from backend and merges results
 * (backend takes priority for ordering since it's server-tracked).
 * Provides `addRecentlyViewed` to call when an ad detail page loads.
 */
export function useRecentlyViewed() {
  const { isAuthenticated } = useAuth();
  const [localItems, setLocalItems] = useState<Ad[]>([]);

  useEffect(() => {
    setLocalItems(readFromStorage());
  }, []);

  // Fetch backend recently viewed for authenticated users
  const { data: backendItems } = useQuery<Ad[]>({
    queryKey: ['recently-viewed'],
    queryFn: () => adsService.recentlyViewed(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  // Merge: backend items first, then local-only items (deduped)
  const items = (() => {
    if (!backendItems?.length) return dedupeById(localItems);
    const backendIds = new Set(backendItems.map((a) => String(a.id)));
    const localOnly = localItems.filter((a) => !backendIds.has(String(a.id)));
    return dedupeById([...backendItems, ...localOnly]).slice(0, MAX_ITEMS);
  })();

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setLocalItems(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setLocalItems(readFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const addRecentlyViewed = useCallback((ad: Ad) => {
    setLocalItems((prev) => {
      const adId = String(ad.id);
      const filtered = prev.filter((item) => String(item.id) !== adId);
      const updated = [ad, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage quota errors
      }
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setLocalItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { items, addRecentlyViewed, clearRecentlyViewed };
}
