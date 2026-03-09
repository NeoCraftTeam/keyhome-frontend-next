'use client';

import { paymentsService } from '@/services/payments.service';
import { FlutterwaveInitiatePayload, FlutterwaveInitiateResponse } from '@/types';
import { useCallback, useState } from 'react';

interface UsePaymentState {
  isLoading: boolean;
  error: string | null;
  response: FlutterwaveInitiateResponse | null;
}

interface UsePaymentReturn extends UsePaymentState {
  initiatePayment: (payload: FlutterwaveInitiatePayload) => Promise<void>;
  resetPayment: () => void;
}

/**
 * Hook for initiating a Flutterwave payment.
 *
 * On success, automatically redirects the user to the Flutterwave hosted
 * checkout page and stores the tx_ref in sessionStorage for retrieval on
 * the callback page.
 */
export function usePayment(): UsePaymentReturn {
  const [state, setState] = useState<UsePaymentState>({
    isLoading: false,
    error: null,
    response: null,
  });

  const initiatePayment = useCallback(async (payload: FlutterwaveInitiatePayload): Promise<void> => {
    setState({ isLoading: true, error: null, response: null });

    try {
      const result = await paymentsService.flutterwaveInitiate(payload);

      setState({ isLoading: false, error: null, response: result });

      // Persist tx_ref so the callback page can retrieve it even if the
      // user comes back from a different tab.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('kh_flw_tx_ref', result.tx_ref);
        sessionStorage.setItem('kh_flw_reference', result.reference);
      }

      // Redirect to Flutterwave hosted checkout
      window.location.href = result.payment_link;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Une erreur est survenue lors de l\'initialisation du paiement.';

      setState({ isLoading: false, error: message, response: null });
    }
  }, []);

  const resetPayment = useCallback((): void => {
    setState({ isLoading: false, error: null, response: null });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kh_flw_tx_ref');
      sessionStorage.removeItem('kh_flw_reference');
    }
  }, []);

  return { ...state, initiatePayment, resetPayment };
}
