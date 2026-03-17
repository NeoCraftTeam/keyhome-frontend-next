'use client';

import { Ad } from '@/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type CompareDrawerMode = 'table' | 'recently_viewed';

interface ComparatorContextType {
  items: Ad[];
  add: (ad: Ad) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  /** Open drawer in 'recently_viewed' mode (from ad detail page) or 'table' mode (from floating bar) */
  openDrawer: (mode: CompareDrawerMode) => void;
  drawerMode: CompareDrawerMode | null;
  maxReached: boolean;
  clearMaxReached: () => void;
}

const ComparatorContext = createContext<ComparatorContextType | null>(null);

const STORAGE_KEY = 'keyhome_comparator';
export const COMPARATOR_MAX_ITEMS = 4;

function loadItems(): Ad[] {
  if (typeof window === 'undefined') { return []; }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ComparatorProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Ad[]>(loadItems);
  const [isOpen, setOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<CompareDrawerMode | null>(null);
  const [maxReached, setMaxReached] = useState(false);

  const openDrawer = useCallback((mode: CompareDrawerMode) => {
    setDrawerMode(mode);
    setOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((ad: Ad) => {
    setItems((prev) => {
      if (prev.find((a) => a.id === ad.id)) { return prev; }
      if (prev.length >= COMPARATOR_MAX_ITEMS) {
        setMaxReached(true);
        return prev;
      }
      return [...prev, ad];
    });
  }, []);

  const clearMaxReached = useCallback(() => setMaxReached(false), []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  const handleSetOpen = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) setDrawerMode(null);
  }, []);

  return (
    <ComparatorContext.Provider value={{ items, add, remove, clear, isSelected, isOpen, setOpen: handleSetOpen, openDrawer, drawerMode, maxReached, clearMaxReached }}>
      {children}
    </ComparatorContext.Provider>
  );
}

export function useComparator() {
  const ctx = useContext(ComparatorContext);
  if (!ctx) { throw new Error('useComparator must be used inside ComparatorProvider'); }
  return ctx;
}
