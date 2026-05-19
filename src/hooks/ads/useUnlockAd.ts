'use client';

/**
 * useUnlockAd — credit-based ad unlock + credit package purchase.
 *
 * Owns:
 *  - handleUnlock: calls paymentsService.initialize, updates credits cache,
 *    invalidates ad cache, shows snackbar on success
 *  - handlePurchasePackage: redirects to Flutterwave checkout for credit top-up
 *  - All loading / error state for the payment dialog
 */

import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { getSafeErrorMessage } from '@/lib/error-messages';

/** Minimum ms to show the unlock loader so the animation feels intentional. */
const MIN_UNLOCK_LOADER_MS = 3200;
import { creditsService } from '@/services/credits.service';
import { paymentsService } from '@/services/payments.service';
import type { Ad, PointPackage, UnlockResponse } from '@/types';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export interface UseUnlockAdReturn {
  isPaymentLoading: boolean;
  isPackageLoading: string | null;
  paymentError: string;
  paymentDialogOpen: boolean;
  setPaymentDialogOpen: (v: boolean) => void;
  unlockState: UnlockResponse | null;
  confirmStep: boolean;
  setConfirmStep: (v: boolean) => void;
  handleUnlock: () => Promise<void>;
  handlePurchasePackage: (pkg: PointPackage) => Promise<void>;
}

export function useUnlockAd(
  ad: Ad,
  adSlug: string,
  isAuthenticated: boolean,
  setSnackbar: (msg: string) => void,
  setSnackbarSuccess: (v: boolean) => void
): UseUnlockAdReturn {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();
  const { play: playSound } = useSoundFeedback();

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPackageLoading, setIsPackageLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [unlockState, setUnlockState] = useState<UnlockResponse | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);

  const handleUnlock = async (): Promise<void> => {
    const startedAt = Date.now();
    setPaymentError('');
    setUnlockState(null);
    setIsPaymentLoading(true);
    let unlockSuccess = false;

    try {
      const response = await paymentsService.initialize(ad.id);
      setUnlockState(response);
      if (
        response.status === 'unlocked' ||
        response.status === 'already_unlocked' ||
        response.status === 'owner'
      ) {
        unlockSuccess = true;
        if (response.points_balance !== undefined) {
          queryClient.setQueryData<number>(
            ['credits-balance'],
            response.points_balance
          );
        } else {
          const pointsUsed = response.points_used ?? 0;
          queryClient.setQueryData<number>(['credits-balance'], (old) =>
            Math.max(0, (old ?? 0) - pointsUsed)
          );
        }
      }
    } catch (err) {
      setPaymentError(
        getSafeErrorMessage(err, 'Erreur lors du déverrouillage.')
      );
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_UNLOCK_LOADER_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      if (unlockSuccess) {
        await queryClient.invalidateQueries({
          queryKey: ['ad', adSlug, isAuthenticated],
        });
        queryClient.invalidateQueries({ queryKey: ['unlocked-ads'] });
        setPaymentDialogOpen(false);
        setSnackbarSuccess(true);
        setSnackbar('Annonce déverrouillée avec succès !');
        playSound('success');
        track('contact_click', {
          ad_id: ad.id,
          unlock_status: unlockState?.status,
        });
      }
      setIsPaymentLoading(false);
    }
  };

  const handlePurchasePackage = async (pkg: PointPackage): Promise<void> => {
    setIsPackageLoading(pkg.id);
    setPaymentError('');
    try {
      const probeUrl = `${window.location.origin}/credits/callback?ad_id=${ad.id}`;
      const response = await creditsService.purchase(pkg.id, probeUrl);
      if (!redirectToTrustedUrl(response.payment_url)) {
        throw new Error('URL de paiement non approuvée.');
      }
    } catch (err) {
      setPaymentError(
        getSafeErrorMessage(err, "Erreur lors de l'initialisation du paiement.")
      );
    } finally {
      setIsPackageLoading(null);
    }
  };

  return {
    isPaymentLoading,
    isPackageLoading,
    paymentError,
    paymentDialogOpen,
    setPaymentDialogOpen,
    unlockState,
    confirmStep,
    setConfirmStep,
    handleUnlock,
    handlePurchasePackage,
  };
}
