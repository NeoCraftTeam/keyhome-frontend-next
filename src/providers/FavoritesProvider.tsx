'use client';

import api from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Ad } from '@/types';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Ad[]>([]);
  const hasSynced = useRef(false);

  // ── localStorage helpers ────────────────────────────────────────────
  const readLocal = useCallback((): Ad[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id) {
          return parsed.slice(0, MAX_FAVORITES);
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    return [];
  }, []);

  const persist = useCallback((ads: Ad[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ads.slice(0, MAX_FAVORITES)));
    } catch {
      /* ignore — storage quota may be exceeded */
    }
  }, []);

  // ── Initial hydration: localStorage first (instant) ─────────────────
  useEffect(() => {
    setFavorites(readLocal());
  }, [readLocal]);

  // ── API sync: when authenticated, fetch server favorites & merge ────
  useEffect(() => {
    if (!isAuthenticated || hasSynced.current) return;

    const syncFromApi = async () => {
      try {
        const { data } = await api.get('/my/favorites');
        const serverAds: Ad[] = data?.data ?? [];

        if (serverAds.length === 0) {
          // Server has no favorites — push local ones to server
          const local = readLocal();
          if (local.length > 0) {
            await Promise.allSettled(local.map((ad) => api.post(`/ads/${ad.id}/favorite`)));
          }
        } else {
          // Merge: server is source of truth, add any local-only ones
          const localAds = readLocal();
          const serverIds = new Set(serverAds.map((a) => a.id));
          const localOnly = localAds.filter((a) => !serverIds.has(a.id));

          // Push local-only favorites to server (fire-and-forget)
          if (localOnly.length > 0) {
            Promise.allSettled(localOnly.map((ad) => api.post(`/ads/${ad.id}/favorite`)));
          }

          // Merged list: server favorites + local-only
          const merged = [...serverAds, ...localOnly].slice(0, MAX_FAVORITES);
          setFavorites(merged);
          persist(merged);
        }

        hasSynced.current = true;
      } catch {
        // API unavailable — keep localStorage favorites
      }
    };

    syncFromApi();
  }, [isAuthenticated, readLocal, persist]);

  // Reset sync flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasSynced.current = false;
    }
  }, [isAuthenticated]);

  // ── Derived state ───────────────────────────────────────────────────
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  const isFavorite = useCallback((adId: string) => favoriteIds.has(adId), [favoriteIds]);

  // ── Toggle: update local state immediately, sync to API in background
  const toggleFavorite = useCallback(
    (ad: Ad) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === ad.id);
        const next = exists ? prev.filter((f) => f.id !== ad.id) : [...prev, ad];
        persist(next);
        return next;
      });

      // Fire-and-forget API call when authenticated
      if (isAuthenticated) {
        api.post(`/ads/${ad.id}/favorite`).catch(() => {
          /* silent — localStorage is the fallback */
        });
      }
    },
    [persist, isAuthenticated]
  );

  const removeFavorite = useCallback(
    (adId: string) => {
      setFavorites((prev) => {
        const wasPresent = prev.some((f) => f.id === adId);
        const next = prev.filter((f) => f.id !== adId);
        persist(next);

        // If removing a favorite, toggle it off on the server
        if (wasPresent && isAuthenticated) {
          api.post(`/ads/${adId}/favorite`).catch(() => {});
        }

        return next;
      });
    },
    [persist, isAuthenticated]
  );

  const clearFavorites = useCallback(() => {
    // Unfavorite each on the server
    if (isAuthenticated) {
      favorites.forEach((f) => {
        api.post(`/ads/${f.id}/favorite`).catch(() => {});
      });
    }
    setFavorites([]);
    persist([]);
  }, [persist, isAuthenticated, favorites]);

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
