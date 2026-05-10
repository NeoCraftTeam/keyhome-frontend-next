/**
 * Lazy-loaded Stripe.js promise. Singleton — `loadStripe` only runs once
 * per browser tab regardless of how many times <Elements> mounts. Stripe.js
 * is ~50 KB gzipped so loading it on demand (only when the PaymentModal
 * actually opens with `gateway === 'stripe'`) keeps the global bundle lean.
 *
 * Required env: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_*` or `pk_live_*`).
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a memoised promise that resolves to the Stripe.js instance.
 * Call once per component lifecycle and pass to `<Elements stripe>`.
 *
 * If the publishable key is missing, returns a promise resolving to `null`
 * — the caller should treat that as "Stripe is not configured" and render
 * an error state rather than throw.
 */
export function getStripePromise(): Promise<Stripe | null> {
  if (stripePromise === null) {
    const key = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'];
    if (!key) {
      console.warn(
        '[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing. Card payments will be disabled.'
      );
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}
