'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import { paymentsService } from '@/services/payments.service';
import type {
  PaymentInitiatePayload,
  PaymentInitiateResponse,
  PaymentInitiateStatus,
} from '@/types';
import { useCallback, useState } from 'react';

interface UsePaymentState {
  isLoading: boolean;
  error: string | null;
  response: PaymentInitiateResponse | null;
  /**
   * Stripe PaymentIntent client secret. Populated only when the backend
   * routed the payment to `gateway: 'stripe'`. Consumed by
   * `<StripeConfirmStep>` inside `<PaymentModal>` — the user stays on
   * KeyHome instead of redirecting.
   */
  stripeClientSecret: string | null;
  /**
   * Normalised initial status the backend reported AFTER calling the
   * gateway. For Stripe off-session charges this is the one-shot result
   * (`success` | `requires_action` | `failed`) — the caller can skip the
   * Stripe Elements roundtrip in those cases. For new-card flows this
   * stays `pending` until the user confirms.
   */
  stripeInitialStatus: PaymentInitiateStatus | null;
  /**
   * Which Stripe SDK flow to mount for `stripeClientSecret`:
   *  - `'checkout_session'` → `CheckoutElementsProvider` (new-card flow)
   *  - `'payment_intent'`  → `<Elements>` (saved-card / off-session 3DS)
   * `null` for non-Stripe gateways or before initiation.
   */
  stripeFlow: 'checkout_session' | 'payment_intent' | null;
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
    payload: PaymentInitiatePayload
  ) => Promise<PaymentInitiateResponse | null>;
  resetPayment: () => void;
}

/**
 * Hook for initiating a payment.
 *
 * Behaviour by gateway :
 *  - `kpay` (and other hosted checkouts) → automatic redirect to the hosted checkout.
 *  - `stripe` → no redirect; exposes `stripeClientSecret` so the caller can
 *    mount `<Elements>` + `<PaymentElement>` and confirm in-page.
 */
export function usePayment(): UsePaymentReturn {
  const [state, setState] = useState<UsePaymentState>({
    isLoading: false,
    error: null,
    response: null,
    stripeClientSecret: null,
    stripeInitialStatus: null,
    stripeFlow: null,
  });

  const initiatePayment = useCallback(
    async (
      payload: PaymentInitiatePayload
    ): Promise<PaymentInitiateResponse | null> => {
      setState({
        isLoading: true,
        error: null,
        response: null,
        stripeClientSecret: null,
        stripeInitialStatus: null,
        stripeFlow: null,
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
            stripeInitialStatus: result.status,
            stripeFlow: result.stripe_flow ?? 'payment_intent',
          });
          return result;
        }

        // Kpay hosted checkout : redirect immediately.
        // Avoid setting React state first — that paints a one-frame KeyHome
        // "redirection…" step before the gateway UI.
        if (typeof window !== 'undefined') {
          window.location.assign(result.payment_link);
        }
        return result;
      } catch (err: unknown) {
        const message = getSafeErrorMessage(
          err,
          "Une erreur est survenue lors de l'initialisation du paiement."
        );

        setState({
          isLoading: false,
          error: message,
          response: null,
          stripeClientSecret: null,
          stripeInitialStatus: null,
          stripeFlow: null,
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
      stripeInitialStatus: null,
      stripeFlow: null,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kh_flw_tx_ref');
      sessionStorage.removeItem('kh_flw_reference');
    }
  }, []);

  return { ...state, initiatePayment, resetPayment };
}
