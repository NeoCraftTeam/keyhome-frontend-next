'use client';

import { Ad } from '@/types';
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
 * Provides `addRecentlyViewed` to call when an ad detail page loads.
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState<Ad[]>([]);

  useEffect(() => {
    setItems(readFromStorage());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setItems(readFromStorage());
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
    setItems((prev) => {
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
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { items, addRecentlyViewed, clearRecentlyViewed };
}
