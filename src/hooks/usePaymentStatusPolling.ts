'use client';

import {
  isGatewayRedirectSuccess,
  shouldDeferVerifyFailure,
} from '@/lib/payment/payment-gateway-return';
import { creditsService } from '@/services/credits.service';
import { paymentsService } from '@/services/payments.service';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Public payment statuses returned by the auth-less endpoint.
 *
 * `unknown` is normalised to `pending` from the consumer's perspective —
 * the payment may simply not be in our DB yet (initiate latency) or the
 * user landed on the callback URL with a stale `tx_ref`.
 */
export type PublicPaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'unknown';

/**
 * Aggregated polling status surfaced to the UI.
 *
 *  - `verifying`   : initial fast poll (0 < 30 s, exponential back-off)
 *  - `processing`  : fast poll exhausted, slow background poll continues
 *  - `success`     : terminal — payment confirmed
 *  - `failed`      : terminal — gateway returned `failed`
 *  - `cancelled`   : terminal — user cancelled the payment
 *  - `auth_lost`   : the authenticated verify call returned 401, the public
 *                    fallback is being used; UI should hint at re-login
 *  - `not_found`   : `tx_ref` not found / no recent purchase to verify
 */
export type PaymentPollingState =
  | 'verifying'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'auth_lost'
  | 'not_found';

interface UsePaymentStatusPollingOptions {
  /** `tx_ref` returned by `purchase()` / `initiate()`. */
  txRef: string | null;
  /** GeniusPay `reference` (MTX-* / SANDBOX_*) when the redirect omits `tx_ref`. */
  gatewayReference?: string | null;
  /** `status` query param from the hosted checkout redirect (`completed`, …). */
  gatewayRedirectStatus?: string | null;
  /**
   * Variant: 'credit' uses `/credits/verify-purchase` (returns balance),
   * 'unlock' uses `/payments/verify_payment` (returns `is_paid` + ad_id).
   */
  variant: 'credit' | 'unlock';
  /**
   * When `true`, skip polling entirely (e.g. the gateway already returned
   * a terminal `?status=cancelled` in the URL).
   */
  skip?: boolean;
  /** Called once when polling reaches a terminal `success` state. */
  onSuccess?: () => void;
  /**
   * Minimum time the verifying UI is displayed before transitioning to a
   * terminal state. Stripe off-session charges resolve in ~150 ms, which
   * makes the verification feel skipped — gating the transition with a short
   * dwell gives the user a deliberate "we are checking your payment" moment,
   * matching hosted checkouts. Side effects (`onSuccess`, balance refresh)
   * fire immediately; only the visible state transition is deferred.
   *
   * Set to `0` to disable.
   *
   * @default DEFAULT_MINIMUM_VERIFYING_MS
   */
  minimumVerifyingMs?: number;
}

/** Default minimum dwell before terminal UI; `VerifyingView` documents the same. */
export const DEFAULT_MINIMUM_VERIFYING_MS = 4000;

interface UsePaymentStatusPollingResult {
  state: PaymentPollingState;
  /** Updated balance after a successful credit purchase. `null` until known. */
  pointBalance: number | null;
  /** `0..1` progress for the initial fast-poll phase. */
  fastPollProgress: number;
  /** Manual retry — useful from a "Réessayer" button. */
  retry: () => void;
}

const FAST_MAX_RETRIES = 18; // ~30 s with exponential back-off
const FAST_INITIAL_MS = 800;
const FAST_MAX_MS = 4000;
const SLOW_MAX_RETRIES = 36; // 36 × 5 s = 3 min
const SLOW_POLL_MS = 5000;

/**
 * Robust payment polling that survives :
 *  - lost session cookies (cross-origin Flutterwave redirect)
 *  - slow webhooks (mobile money operators take 30–60 s)
 *  - transient network failures (mobile data on returning home)
 *
 * Strategy:
 *   1. Try the authenticated endpoint first. It returns balance + status,
 *      enabling instant UI updates.
 *   2. On 401 (session lost during redirect) → fall back to public status.
 *      The user remains "logged in" client-side; the auth_lost state is
 *      surfaced so the UI can show "Reconnectez-vous pour voir votre solde".
 *   3. Other errors (network, 5xx) → swallow and retry next tick.
 *   4. After ~30 s of fast-polling, switch to a slower 5 s background loop
 *      for up to 3 min so a delayed webhook is still picked up without
 *      hammering the server.
 *   5. Strong cancellation: every callback checks the cancel ref so a fast
 *      mount/unmount cycle never schedules a stale timer.
 */
export function usePaymentStatusPolling({
  txRef,
  gatewayReference = null,
  gatewayRedirectStatus = null,
  variant,
  skip = false,
  onSuccess,
  minimumVerifyingMs = DEFAULT_MINIMUM_VERIFYING_MS,
}: UsePaymentStatusPollingOptions): UsePaymentStatusPollingResult {
  const [state, setState] = useState<PaymentPollingState>('verifying');
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [fastAttempt, setFastAttempt] = useState(0);

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Floor timer dedicated to the minimum-verifying-duration gate. Kept
  // separate from `timerRef` so a parallel polling iteration can't cancel
  // the deferred terminal transition (or vice-versa).
  const floorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authLostRef = useRef(false);
  const successFiredRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  // Seeded in the polling `useEffect` / `retry()` — avoid Date.now in ref init
  // (React purity rule: render must not call impure fns).
  const startTsRef = useRef(0);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (floorTimerRef.current) {
      clearTimeout(floorTimerRef.current);
      floorTimerRef.current = null;
    }
  }, []);

  const fireSuccessOnce = useCallback(() => {
    if (successFiredRef.current) return;
    successFiredRef.current = true;
    try {
      onSuccessRef.current?.();
    } catch {
      /* never let a parent callback throw inside polling */
    }
  }, []);

  // Defers a terminal state transition until `minimumVerifyingMs` has
  // elapsed since the polling session started. The optional `sideEffect`
  // callback (typically `fireSuccessOnce`) is invoked at the SAME moment
  // as the state mutation so the consuming UI never displays a half-step
  // where downstream caches (header credit-balance, etc.) have refreshed
  // but the verifying screen is still on display — a confusing pattern
  // that suggests the payment is being credited before being verified.
  //
  // Money-safety note: the underlying payment is already idempotently
  // settled server-side by the time we reach this function (Stripe
  // off-session: `PaymentSucceeded` listener ran inside the same
  // synchronous `createPayment` transaction). Deferring the UI signals
  // does NOT delay actual fulfilment — only the user-perceived flow.
  const commitTerminal = useCallback(
    (terminal: PaymentPollingState, sideEffect?: () => void): void => {
      if (cancelledRef.current) return;

      const elapsed = Date.now() - startTsRef.current;
      const remaining = minimumVerifyingMs - elapsed;

      const commit = (): void => {
        if (cancelledRef.current) return;
        sideEffect?.();
        setState(terminal);
      };

      if (remaining <= 0) {
        commit();
        return;
      }

      if (floorTimerRef.current) {
        clearTimeout(floorTimerRef.current);
      }
      floorTimerRef.current = setTimeout(() => {
        floorTimerRef.current = null;
        commit();
      }, remaining);
    },
    [minimumVerifyingMs]
  );

  // Single poll iteration. Returns `true` when the loop should stop
  // (terminal status reached or polling was cancelled externally).
  const pollOnce = useCallback(async (): Promise<boolean> => {
    if (cancelledRef.current || (!txRef && !gatewayReference)) {
      return true;
    }

    if (!authLostRef.current) {
      try {
        if (variant === 'credit') {
          const result = await creditsService.verifyPurchase(
            txRef,
            gatewayReference,
            gatewayRedirectStatus
          );
          setPointBalance(result.point_balance ?? null);

          if (result.status === 'completed') {
            commitTerminal('success', fireSuccessOnce);
            return true;
          }
          if (result.status === 'failed') {
            if (shouldDeferVerifyFailure(result, gatewayRedirectStatus)) {
              return false;
            }
            commitTerminal('failed');
            return true;
          }
          if (result.status === 'not_found') {
            commitTerminal('not_found');
            return true;
          }
          return false;
        }

        const verify = await paymentsService.verify(txRef, gatewayReference);
        if (verify.is_paid) {
          commitTerminal('success', fireSuccessOnce);
          return true;
        }
        const s = verify.status?.toLowerCase();
        if (s === 'failed' || s === 'declined' || s === 'error') {
          if (shouldDeferVerifyFailure(verify, gatewayRedirectStatus)) {
            return false;
          }
          commitTerminal('failed');
          return true;
        }
        if (s === 'cancelled') {
          commitTerminal('cancelled');
          return true;
        }
        return false;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          authLostRef.current = true;
          setState((prev) => (prev === 'success' ? prev : 'auth_lost'));
          // fall through to public-status branch
        } else if (
          axios.isAxiosError(err) &&
          err.response?.status === 404 &&
          variant === 'credit'
        ) {
          commitTerminal('not_found');
          return true;
        }
        // Any other error → retry on next tick.
      }
    }

    // Public status fallback — works without auth, returns only the status.
    try {
      const publicKey = txRef ?? gatewayReference;
      if (!publicKey) {
        return false;
      }
      const { status } = await paymentsService.publicStatus(publicKey);
      if (status === 'success') {
        commitTerminal(
          authLostRef.current ? 'auth_lost' : 'success',
          fireSuccessOnce
        );
        return true;
      }
      if (status === 'failed' || status === 'refunded') {
        if (shouldDeferVerifyFailure({ status }, gatewayRedirectStatus)) {
          return false;
        }
        commitTerminal('failed');
        return true;
      }
      if (status === 'cancelled') {
        commitTerminal('cancelled');
        return true;
      }
      // 'pending' / 'unknown' → keep polling
      return false;
    } catch {
      return false;
    }
  }, [
    txRef,
    gatewayReference,
    gatewayRedirectStatus,
    variant,
    fireSuccessOnce,
    commitTerminal,
  ]);

  // Refs avoid the cyclic deps between fast and slow loops while keeping
  // a single source of truth for the current iteration logic.
  const pollOnceRef = useRef(pollOnce);
  useEffect(() => {
    pollOnceRef.current = pollOnce;
  }, [pollOnce]);

  const runSlowLoopRef = useRef<(attempt: number) => void>(() => undefined);
  const runFastLoopRef = useRef<(attempt: number) => void>(() => undefined);

  useEffect(() => {
    const slow = (attempt: number): void => {
      if (cancelledRef.current) return;
      void pollOnceRef.current().then((done) => {
        if (done || cancelledRef.current) return;
        if (attempt + 1 >= SLOW_MAX_RETRIES) {
          if (isGatewayRedirectSuccess(gatewayRedirectStatus)) {
            commitTerminal('success', fireSuccessOnce);
            return;
          }
          setState((prev) =>
            prev === 'success' || prev === 'failed' || prev === 'cancelled'
              ? prev
              : 'processing'
          );
          return;
        }
        timerRef.current = setTimeout(() => slow(attempt + 1), SLOW_POLL_MS);
      });
    };

    const fast = (attempt: number): void => {
      if (cancelledRef.current) return;
      void pollOnceRef.current().then((done) => {
        if (done || cancelledRef.current) return;
        setFastAttempt(attempt + 1);
        if (attempt + 1 >= FAST_MAX_RETRIES) {
          setState((prev) =>
            prev === 'verifying' || prev === 'auth_lost' ? 'processing' : prev
          );
          slow(0);
          return;
        }
        const delay = Math.min(
          FAST_INITIAL_MS * Math.pow(1.5, attempt),
          FAST_MAX_MS
        );
        timerRef.current = setTimeout(() => fast(attempt + 1), delay);
      });
    };

    runSlowLoopRef.current = slow;
    runFastLoopRef.current = fast;
  }, []);

  const retry = useCallback(() => {
    clearTimer();
    cancelledRef.current = false;
    authLostRef.current = false;
    successFiredRef.current = false;
    startTsRef.current = Date.now();
    setFastAttempt(0);
    setState('verifying');
    runFastLoopRef.current(0);
  }, [clearTimer]);

  useEffect(() => {
    cancelledRef.current = false;
    startTsRef.current = Date.now();
    if (skip || (!txRef && !gatewayReference)) {
      return () => {
        cancelledRef.current = true;
        clearTimer();
      };
    }
    runFastLoopRef.current(0);
    return () => {
      cancelledRef.current = true;
      clearTimer();
    };
  }, [skip, txRef, gatewayReference, variant, clearTimer]);

  const fastPollProgress = Math.min(fastAttempt / FAST_MAX_RETRIES, 1);

  return {
    state,
    pointBalance,
    fastPollProgress,
    retry,
  };
}
