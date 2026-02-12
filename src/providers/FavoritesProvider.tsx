'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Ad } from '@/types';

const STORAGE_KEY = 'keyhome_favorites';

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
  const [favorites, setFavorites] = useState<Ad[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((ads: Ad[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
    } catch {
      // ignore
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
