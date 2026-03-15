'use client';

import { Ad } from '@/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ComparatorContextType {
  items: Ad[];
  add: (ad: Ad) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  maxReached: boolean;
  clearMaxReached: () => void;
}

const ComparatorContext = createContext<ComparatorContextType | null>(null);

const STORAGE_KEY = 'keyhome_comparator';

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
  const [maxReached, setMaxReached] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((ad: Ad) => {
    setItems((prev) => {
      if (prev.find((a) => a.id === ad.id)) { return prev; }
      if (prev.length >= 3) {
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

  return (
    <ComparatorContext.Provider value={{ items, add, remove, clear, isSelected, isOpen, setOpen, maxReached, clearMaxReached }}>
      {children}
    </ComparatorContext.Provider>
  );
}

export function useComparator() {
  const ctx = useContext(ComparatorContext);
  if (!ctx) { throw new Error('useComparator must be used inside ComparatorProvider'); }
  return ctx;
}
