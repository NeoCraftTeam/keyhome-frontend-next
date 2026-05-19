'use client';

/**
 * useAdFormTour — 360° virtual tour scene management for AdFormWizard.
 *
 * Owns:
 *  - tourScenes state (initialized from existing ad.tour_config)
 *  - Signed-URL refresh effect (fetches fresh presigned URLs once on mount)
 *  - addTourScene, updateTourScene (handles object-URL lifecycle), removeTourScene
 *  - tourSceneCount (scenes that have a file or existing URL)
 *
 * Object URLs created on file selection are revoked on scene update/remove
 * and on unmount to prevent memory leaks.
 */

import type { TourScene } from '@/components/owner/ad-form/types';
import { adsService } from '@/services/ads.service';
import type { Ad } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export interface UseAdFormTourReturn {
  tourScenes: TourScene[];
  setTourScenes: React.Dispatch<React.SetStateAction<TourScene[]>>;
  addTourScene: () => void;
  updateTourScene: (
    index: number,
    field: keyof TourScene,
    value: TourScene[keyof TourScene]
  ) => void;
  removeTourScene: (index: number) => void;
  tourSceneCount: number;
}

export function useAdFormTour(ad: Ad | undefined): UseAdFormTourReturn {
  const [tourScenes, setTourScenes] = useState<TourScene[]>(() => {
    if (ad?.has_3d_tour && ad.tour_config?.scenes) {
      return ad.tour_config.scenes.map((s) => ({
        id: s.id,
        title: s.title,
        file: null,
        previewUrl: s.image_url || '',
        hotspots: s.hotspots || [],
      }));
    }
    return [];
  });

  // Refresh signed preview URLs for existing scenes (presigned URLs expire)
  useEffect(() => {
    if (!ad?.id || !ad.has_3d_tour) return;
    let cancelled = false;
    adsService
      .getTour(ad.id)
      .then((res) => {
        if (cancelled) return;
        const signedScenes = (
          res.config as { scenes?: Array<{ id: string; image_url?: string }> }
        )?.scenes;
        if (!signedScenes?.length) return;
        setTourScenes((prev) =>
          prev.map((scene) => {
            if (scene.file) return scene;
            const signed = signedScenes.find((s) => s.id === scene.id);
            return signed?.image_url
              ? { ...scene, previewUrl: signed.image_url }
              : scene;
          })
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ad?.id, ad?.has_3d_tour]);

  // Revoke all blob object URLs on unmount
  useEffect(() => {
    return () => {
      tourScenes.forEach((s) => {
        if (s.previewUrl?.startsWith('blob:'))
          URL.revokeObjectURL(s.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTourScene = useCallback(() => {
    setTourScenes((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: '',
        file: null,
        previewUrl: '',
        hotspots: [],
      },
    ]);
  }, []);

  const updateTourScene = useCallback(
    (
      index: number,
      field: keyof TourScene,
      value: TourScene[keyof TourScene]
    ) => {
      setTourScenes((prev) =>
        prev.map((s, i) => {
          if (i !== index) return s;
          if (field === 'file' && value instanceof File) {
            if (s.previewUrl?.startsWith('blob:'))
              URL.revokeObjectURL(s.previewUrl);
            return {
              ...s,
              file: value,
              previewUrl: URL.createObjectURL(value),
            };
          }
          return { ...s, [field]: value };
        })
      );
    },
    []
  );

  const removeTourScene = useCallback((index: number) => {
    setTourScenes((prev) => {
      const scene = prev[index];
      if (scene?.previewUrl?.startsWith('blob:'))
        URL.revokeObjectURL(scene.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return {
    tourScenes,
    setTourScenes,
    addTourScene,
    updateTourScene,
    removeTourScene,
    tourSceneCount: tourScenes.filter((s) => s.file || s.previewUrl).length,
  };
}
