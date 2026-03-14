'use client';

import { Ad } from '@/types';
import { createContext, useCallback, useContext, useState } from 'react';

interface ComparatorContextType {
  items: Ad[];
  add: (ad: Ad) => void;
  remove: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const ComparatorContext = createContext<ComparatorContextType | null>(null);

export function ComparatorProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Ad[]>([]);
  const [isOpen, setOpen] = useState(false);

  const add = useCallback((ad: Ad) => {
    setItems((prev) => {
      if (prev.find((a) => a.id === ad.id) || prev.length >= 3) { return prev; }
      return [...prev, ad];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isSelected = useCallback((id: string) => items.some((a) => a.id === id), [items]);

  return (
    <ComparatorContext.Provider value={{ items, add, remove, clear, isSelected, isOpen, setOpen }}>
      {children}
    </ComparatorContext.Provider>
  );
}

export function useComparator() {
  const ctx = useContext(ComparatorContext);
  if (!ctx) { throw new Error('useComparator must be used inside ComparatorProvider'); }
  return ctx;
}
