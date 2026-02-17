'use client';

import { Ad } from '@/types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'keyhome_favorites';
const MAX_FAVORITES = 100;

interface FavoritesContextType {
  favorites: Ad[];
  favoriteIds: Set<string>;
  isFavorite: (adId: string) => boolean;
  toggleFavorite: (ad: Ad) => void;
  removeFavorite: (adId: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Initialize empty to avoid SSR hydration mismatch
  const [favorites, setFavorites] = useState<Ad[]>([]);

  // Hydrate from localStorage after mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id) {
          setFavorites(parsed.slice(0, MAX_FAVORITES));
        } else {
          // Legacy format (ID-only array) — clear it, data is unrecoverable
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((ads: Ad[]) => {
    try {
      // Store full Ad objects so favorites survive page reload
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads.slice(0, MAX_FAVORITES)));
    } catch {
      // ignore — storage quota may be exceeded
    }
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const isFavorite = useCallback((adId: string) => favoriteIds.has(adId), [favoriteIds]);

  const toggleFavorite = useCallback(
    (ad: Ad) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === ad.id);
        const next = exists ? prev.filter((f) => f.id !== ad.id) : [...prev, ad];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeFavorite = useCallback(
    (adId: string) => {
      setFavorites((prev) => {
        const next = prev.filter((f) => f.id !== adId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({ favorites, favoriteIds, isFavorite, toggleFavorite, removeFavorite, clearFavorites }),
    [favorites, favoriteIds, isFavorite, toggleFavorite, removeFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
