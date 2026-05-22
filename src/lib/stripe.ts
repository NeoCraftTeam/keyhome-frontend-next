/**
 * Lazy-loaded Stripe.js promise. Singleton keyed on the publishable key —
 * `loadStripe` only runs once per browser tab (or once per key change).
 * Stripe.js is ~50 KB gzipped so loading it on demand (only when the
 * PaymentModal actually opens with `gateway === 'stripe'`) keeps the global
 * bundle lean.
 *
 * Required env: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_*` or `pk_live_*`).
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
let _loadedKey: string | null = null;

/**
 * Returns a memoised promise that resolves to the Stripe.js instance.
 * Call once per component lifecycle and pass to `<Elements stripe>`.
 *
 * The promise is invalidated and recreated whenever the publishable key
 * changes (e.g. switching between test and live builds).
 *
 * If the publishable key is missing, returns a promise resolving to `null`
 * — the caller should treat that as "Stripe is not configured" and render
 * an error state rather than throw.
 */
export function getStripePromise(): Promise<Stripe | null> {
  const key = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? null;
  if (stripePromise !== null && _loadedKey === key) {
    return stripePromise;
  }
  _loadedKey = key;
  if (!key) {
    console.warn(
      '[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing. Card payments will be disabled.'
    );
    stripePromise = Promise.resolve(null);
  } else {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/**
 * Returns `true` when the Stripe client secret's mode (live/test) conflicts
 * with the configured publishable key's mode.
 *
 * A live checkout session (`cs_live_…`) loaded with a test publishable key
 * (`pk_test_…`) will always return "No such checkout.session" from Stripe —
 * catching this early surfaces a clear configuration error instead.
 */
export function isStripeModeMismatch(clientSecret: string): boolean {
  const key = process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? '';
  if (!key || !clientSecret) return false;
  const keyIsLive = key.startsWith('pk_live_');
  const keyIsTest = key.startsWith('pk_test_');
  if (!keyIsLive && !keyIsTest) return false;
  // Checkout Sessions expose mode clearly in their ID prefix
  if (clientSecret.startsWith('cs_live_') && keyIsTest) return true;
  if (clientSecret.startsWith('cs_test_') && keyIsLive) return true;
  return false;
}
