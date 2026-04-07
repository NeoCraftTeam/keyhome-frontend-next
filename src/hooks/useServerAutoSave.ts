'use client';

// Server-side auto-save hook for ad drafts.
// - On first save: calls onCreateDraft(values) → returns { id: string }
// - On subsequent saves: calls onUpdateDraft(draftId, values)
// - Debounced (default 5000ms)
// - Provides: savedAt (Date|null), isSaving (boolean), draftId (string|null), clearSavedAt()

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseServerAutoSaveOptions<T> {
  data: T;
  draftId: string | null;
  onCreateDraft: (data: T) => Promise<string>;
  onUpdateDraft: (id: string, data: T) => Promise<void>;
  enabled?: boolean;
  debounceMs?: number;
}

interface UseServerAutoSaveReturn {
  savedAt: Date | null;
  isSaving: boolean;
  draftId: string | null;
  clearSavedAt: () => void;
}

export function useServerAutoSave<T>({
  data,
  draftId: externalDraftId,
  onCreateDraft,
  onUpdateDraft,
  enabled = true,
  debounceMs = 5000,
}: UseServerAutoSaveOptions<T>): UseServerAutoSaveReturn {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [internalDraftId, setInternalDraftId] = useState<string | null>(
    externalDraftId
  );

  // Sync when the parent provides an updated draft ID (e.g. navigating to the edit page)
  const externalDraftIdRef = useRef(externalDraftId);
  useEffect(() => {
    if (
      externalDraftId !== null &&
      externalDraftId !== externalDraftIdRef.current
    ) {
      externalDraftIdRef.current = externalDraftId;
      setInternalDraftId(externalDraftId);
    }
  }, [externalDraftId]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPendingRef = useRef(false);
  const lastSavedDataRef = useRef<string>(JSON.stringify(data));

  // Refs for values that change but should not retrigger the debounce effect
  const latestDataRef = useRef<T>(data);
  const internalDraftIdRef = useRef<string | null>(internalDraftId);
  const onCreateDraftRef = useRef(onCreateDraft);
  const onUpdateDraftRef = useRef(onUpdateDraft);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);
  useEffect(() => {
    internalDraftIdRef.current = internalDraftId;
  }, [internalDraftId]);
  useEffect(() => {
    onCreateDraftRef.current = onCreateDraft;
  }, [onCreateDraft]);
  useEffect(() => {
    onUpdateDraftRef.current = onUpdateDraft;
  }, [onUpdateDraft]);

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    // Bail early if data has not changed since the last successful save
    if (serialized === lastSavedDataRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Skip if a save is already in flight
      if (isPendingRef.current) return;

      const currentData = latestDataRef.current;
      const currentSerialized = JSON.stringify(currentData);
      if (currentSerialized === lastSavedDataRef.current) return;

      isPendingRef.current = true;
      setIsSaving(true);

      try {
        const currentDraftId = internalDraftIdRef.current;
        if (currentDraftId === null) {
          const newId = await onCreateDraftRef.current(currentData);
          setInternalDraftId(newId);
          internalDraftIdRef.current = newId;
        } else {
          await onUpdateDraftRef.current(currentDraftId, currentData);
        }
        lastSavedDataRef.current = currentSerialized;
        setSavedAt(new Date());
      } catch {
        // Silent failure — auto-save must never interrupt the user
      } finally {
        isPendingRef.current = false;
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs]);

  const clearSavedAt = useCallback(() => setSavedAt(null), []);

  return { savedAt, isSaving, draftId: internalDraftId, clearSavedAt };
}
