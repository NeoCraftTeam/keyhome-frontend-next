'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'kh_autosave_';
const DEBOUNCE_MS = 2000;

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  savedAt: Date | null;
  hasDraft: boolean;
  restoreDraft: () => T | null;
  clearDraft: () => void;
}

export function useAutoSave<T>({
  key,
  data,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const storageKey = STORAGE_PREFIX + key;
  const [hasDraft, setHasDraft] = useState<boolean>(
    () => typeof window !== 'undefined' && !!localStorage.getItem(storageKey)
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data, ts: Date.now() })
        );
        setSavedAt(new Date());
        setHasDraft(true);
      } catch {
        // localStorage full or unavailable
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, storageKey]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return parsed.data as T;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSavedAt(null);
    setHasDraft(false);
  }, [storageKey]);

  return { savedAt, hasDraft, restoreDraft, clearDraft };
}
