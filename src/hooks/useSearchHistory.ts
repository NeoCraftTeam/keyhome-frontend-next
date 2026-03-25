'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'keyhome_search_history';
const MAX_ITEMS = 8;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

function readHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Persists recent search queries in localStorage.
 * Provides suggestions based on previous searches.
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const addSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q || q.length < 2) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== q.toLowerCase());
      const updated = [{ query: q, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota
      }
      return updated;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const getSuggestions = useCallback(
    (input: string): SearchHistoryItem[] => {
      if (!input.trim()) return history;
      const lower = input.toLowerCase();
      return history.filter((item) => item.query.toLowerCase().includes(lower));
    },
    [history]
  );

  return { history, addSearch, removeSearch, clearHistory, getSuggestions };
}
