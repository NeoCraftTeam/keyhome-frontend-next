'use client';

import { paymentsService } from '@/services/payments.service';
import {
  FlutterwaveInitiatePayload,
  FlutterwaveInitiateResponse,
} from '@/types';
import { useCallback, useState } from 'react';

interface UsePaymentState {
  isLoading: boolean;
  error: string | null;
  response: FlutterwaveInitiateResponse | null;
  /**
   * Stripe PaymentIntent client secret. Populated only when the backend
   * routed the payment to `gateway: 'stripe'`. Consumed by
   * `<StripeConfirmStep>` inside `<PaymentModal>` — the user stays on
   * KeyHome instead of redirecting.
   */
  stripeClientSecret: string | null;
}

interface UsePaymentReturn extends UsePaymentState {
  /**
   * Initiate a payment. Returns the parsed backend response on success
   * (gateway, tx_ref, payment_link / clientSecret) so the caller can
   * branch SYNCHRONOUSLY on `result.gateway` — avoiding the React
   * effect-after-commit race that caused the loading→done→stripe-confirm
   * jump bug. Returns `null` on error ; the human-readable message is
   * exposed via `state.error`.
   */
  initiatePayment: (
    payload: FlutterwaveInitiatePayload
  ) => Promise<FlutterwaveInitiateResponse | null>;
  resetPayment: () => void;
}

/**
 * Hook for initiating a payment.
 *
 * Behaviour by gateway :
 *  - `flutterwave` → automatic redirect to the hosted checkout (legacy flow).
 *  - `stripe` → no redirect; exposes `stripeClientSecret` so the caller can
 *    mount `<Elements>` + `<PaymentElement>` and confirm in-page.
 */
export function usePayment(): UsePaymentReturn {
  const [state, setState] = useState<UsePaymentState>({
    isLoading: false,
    error: null,
    response: null,
    stripeClientSecret: null,
  });

  const initiatePayment = useCallback(
    async (
      payload: FlutterwaveInitiatePayload
    ): Promise<FlutterwaveInitiateResponse | null> => {
      setState({
        isLoading: true,
        error: null,
        response: null,
        stripeClientSecret: null,
      });

      try {
        const result = await paymentsService.initiate(payload);

        // Persist tx_ref so the callback page (and a tab refresh during
        // a Stripe flow) can recover it. Common to both gateways — the
        // verify/cancel endpoints take a tx_ref regardless of gateway.
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('kh_flw_tx_ref', result.tx_ref);
          sessionStorage.setItem('kh_flw_reference', result.reference);
        }

        if (result.gateway === 'stripe') {
          // Stripe : `payment_link` carries the PaymentIntent client secret
          // (`pi_xxx_secret_yyy`). The caller branches on the returned
          // gateway and mounts <Elements> in-page — NO redirect.
          setState({
            isLoading: false,
            error: null,
            response: result,
            stripeClientSecret: result.payment_link,
          });
          return result;
        }

        // Flutterwave : redirect to the hosted checkout. We update the
        // state first so the caller observes the result before the
        // navigation tears down the React tree.
        setState({
          isLoading: false,
          error: null,
          response: result,
          stripeClientSecret: null,
        });
        window.location.href = result.payment_link;
        return result;
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        };
        // Backend gating rejects disabled methods via 422 with a French
        // label — surface that exact message to the user.
        const validationErr =
          axiosErr?.response?.data?.errors?.['payment_method']?.[0];
        const message =
          validationErr ||
          axiosErr?.response?.data?.message ||
          "Une erreur est survenue lors de l'initialisation du paiement.";

        setState({
          isLoading: false,
          error: message,
          response: null,
          stripeClientSecret: null,
        });
        return null;
      }
    },
    []
  );

  const resetPayment = useCallback((): void => {
    setState({
      isLoading: false,
      error: null,
      response: null,
      stripeClientSecret: null,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kh_flw_tx_ref');
      sessionStorage.removeItem('kh_flw_reference');
    }
  }, []);

  return { ...state, initiatePayment, resetPayment };
}
