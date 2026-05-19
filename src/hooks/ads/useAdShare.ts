'use client';

/**
 * useAdShare — clipboard copy + native Web Share API + print PDF.
 *
 * Owns:
 *  - handleShare: copies URL to clipboard, then tries navigator.share (mobile)
 *  - handlePrintPdf: lazy-imports ad-detail-print-pdf and triggers download
 *  - isPrintPdfLoading state
 */

import type { Ad } from '@/types';
import { formatPrice } from '@/lib/constants';
import { useState } from 'react';

export interface UseAdShareReturn {
  handleShare: () => Promise<void>;
  handlePrintPdf: () => Promise<void>;
  isPrintPdfLoading: boolean;
}

export function useAdShare(
  ad: Ad,
  setSnackbar: (msg: string) => void
): UseAdShareReturn {
  const [isPrintPdfLoading, setIsPrintPdfLoading] = useState(false);

  const handleShare = async (): Promise<void> => {
    const shareUrl = window.location.href;
    const shareText = `${ad.title} — ${formatPrice(ad.price)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* clipboard unavailable — continue to native share */
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      setSnackbar('Lien copié dans le presse-papier');
    }
  };

  const handlePrintPdf = async (): Promise<void> => {
    setIsPrintPdfLoading(true);
    try {
      const { openAdDetailPrintPdf } =
        await import('@/lib/ad-detail-print-pdf');
      await openAdDetailPrintPdf({ filenameSlug: ad.slug ?? ad.id });
    } catch {
      /* silently ignore — print is best-effort */
    } finally {
      setIsPrintPdfLoading(false);
    }
  };

  return { handleShare, handlePrintPdf, isPrintPdfLoading };
}
