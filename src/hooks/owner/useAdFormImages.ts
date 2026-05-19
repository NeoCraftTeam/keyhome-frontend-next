'use client';

/**
 * useAdFormImages — photo management for AdFormWizard.
 *
 * Owns:
 *  - images (File[]) + imagePreviewUrls (string[]) + imagesToDelete (number[])
 *  - reorderImages — drag-and-drop reorder, updates both arrays in sync
 *  - openPhotoLightbox / lightbox open state
 *  - compressingPhotos flag (set by the consumer during compression)
 *  - Object-URL cleanup on unmount
 *
 * The actual file-compression logic lives in the consumer (AdFormWizard step 1)
 * because it needs access to the compression library lazily. This hook only
 * manages the resulting File[] + preview URL[] state.
 */

import { useCallback, useEffect, useState } from 'react';

export interface UseAdFormImagesReturn {
  images: File[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  imagePreviewUrls: string[];
  setImagePreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
  imagesToDelete: number[];
  setImagesToDelete: React.Dispatch<React.SetStateAction<number[]>>;
  compressingPhotos: boolean;
  setCompressingPhotos: (v: boolean) => void;
  photoLightboxOpen: boolean;
  photoLightboxIndex: number;
  openPhotoLightbox: (index: number) => void;
  closePhotoLightbox: () => void;
  reorderImages: (from: number, to: number) => void;
}

export function useAdFormImages(): UseAdFormImagesReturn {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false);
  const [photoLightboxIndex, setPhotoLightboxIndex] = useState(0);

  // Revoke blob preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reorderImages = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setImagePreviewUrls((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  const openPhotoLightbox = useCallback((index: number) => {
    setPhotoLightboxIndex(index);
    setPhotoLightboxOpen(true);
  }, []);

  const closePhotoLightbox = useCallback(() => {
    setPhotoLightboxOpen(false);
  }, []);

  return {
    images,
    setImages,
    imagePreviewUrls,
    setImagePreviewUrls,
    imagesToDelete,
    setImagesToDelete,
    compressingPhotos,
    setCompressingPhotos,
    photoLightboxOpen,
    photoLightboxIndex,
    openPhotoLightbox,
    closePhotoLightbox,
    reorderImages,
  };
}
