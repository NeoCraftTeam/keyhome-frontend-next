'use client';

import { COUNTRY_COOKIE } from '@/lib/currency';
import { getStripePromise } from '@/lib/stripe';
import { brand } from '@/theme/tokens';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Read the `kh_country` cookie set by the Next.js middleware (`proxy.ts`)
 * from the `CF-IPCountry` / `x-vercel-ip-country` header. Returns the
 * uppercase ISO 3166-1 alpha-2 code (e.g. `'FR'`, `'CM'`, `'US'`) when
 * present, or `null` when missing / SSR / malformed.
 */
function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COUNTRY_COOKIE}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.slice(COUNTRY_COOKIE.length + 1)).trim();
  return /^[A-Z]{2}$/i.test(raw) ? raw.toUpperCase() : null;
}

interface StripeConfirmStepProps {
  /**
   * The PaymentIntent client secret returned by the backend
   * (`pi_xxx_secret_yyy`). The whole step is keyed on this value so a fresh
   * intent unmounts/remounts <Elements>.
   */
  clientSecret: string;
  /**
   * Called when Stripe.confirmPayment succeeds (the PaymentIntent is in
   * `succeeded` state — the webhook is what triggers the post-payment
   * actions, but the modal can close immediately).
   */
  onSuccess: () => void;
  /**
   * Called when the user clicks "back" to choose another method.
   */
  onBack?: () => void;
  /**
   * Visible amount label — purely cosmetic, shown above the payment form.
   */
  amountLabel?: string;
}

/**
 * Stripe Elements step — drops a `<PaymentElement>` (cards, Apple Pay,
 * Google Pay where available) inside the existing PaymentModal flow.
 *
 * This wrapper exists because `useStripe()` and `useElements()` only work
 * inside `<Elements>`, so the actual confirm logic lives in
 * `<StripeConfirmInner>`.
 */
export default function StripeConfirmStep({
  clientSecret,
  onSuccess,
  onBack,
  amountLabel,
}: StripeConfirmStepProps): React.ReactElement {
  // `getStripePromise()` returns a memoised promise. We resolve it once on
  // mount so we can render a configuration error if the publishable key is
  // missing — instead of the bare "loaderror" the SDK throws.
  const stripePromise = useMemo(() => getStripePromise(), []);
  const [stripeMissing, setStripeMissing] = useState(false);

  // Resolve the visitor's country once on mount from the `kh_country` cookie
  // (set by `proxy.ts` from `CF-IPCountry` / `x-vercel-ip-country`). This is
  // what makes Stripe's PaymentElement surface the right methods (SEPA in
  // Europe, Bancontact in Belgium, Cash App Pay in the US, etc.) and prefill
  // the billing country sensibly. Falls back to `CM` (home market) when
  // unknown — never blocks the flow.
  const visitorCountry = useMemo<string>(() => readCountryCookie() ?? 'CM', []);

  useEffect(() => {
    let cancelled = false;
    stripePromise.then((stripe) => {
      if (!cancelled && stripe === null) {
        setStripeMissing(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stripePromise]);

  if (stripeMissing) {
    return (
      <PaymentConfigError
        title="Paiement par carte indisponible"
        message="La clé publique Stripe n'est pas configurée. Choisissez Mobile Money ou contactez le support."
        onBack={onBack}
      />
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        // French locale for the Stripe-rendered labels (Numéro de carte,
        // Date d'expiration, etc.). Falls back to `auto` if the user's
        // browser language is set otherwise.
        locale: 'fr',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: brand.primary,
            colorBackground: '#ffffff',
            colorText: '#0A1628',
            borderRadius: '10px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        },
        loader: 'auto',
      }}
    >
      <StripeConfirmInner
        onSuccess={onSuccess}
        onBack={onBack}
        amountLabel={amountLabel}
        defaultCountry={visitorCountry}
      />
    </Elements>
  );
}

/**
 * Card configuration error — shown when Stripe.js cannot be initialised at
 * all (missing publishable key, key mismatch with the backend secret, or
 * an aggressive ad-blocker preventing the SDK from loading).
 */
function PaymentConfigError({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack?: () => void;
}): React.ReactElement {
  return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'rgba(211,47,47,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1.5,
        }}
      >
        <ErrorIcon sx={{ color: '#D32F2F', fontSize: 28 }} />
      </Box>
      <Typography variant="body1" fontWeight={700} color="error" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {onBack && (
        <Button
          variant="outlined"
          fullWidth
          onClick={onBack}
          sx={{ borderRadius: 3, py: 1.4, fontWeight: 600 }}
        >
          Choisir un autre moyen
        </Button>
      )}
    </Box>
  );
}

interface StripeConfirmInnerProps {
  onSuccess: () => void;
  onBack?: () => void;
  amountLabel?: string;
  /** ISO 3166-1 alpha-2 country code prefilled in the billing form. */
  defaultCountry: string;
}

function StripeConfirmInner({
  onSuccess,
  onBack,
  amountLabel,
  defaultCountry,
}: StripeConfirmInnerProps): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // PaymentElement fires `loaderror` when Stripe rejects the clientSecret
  // (typically a 401 because the publishable key doesn't match the
  // secret used to create the PaymentIntent), or when an extension blocks
  // the SDK. `loadError` is the human-readable reason ; we render a
  // dedicated error state instead of the empty form.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) {
      // Stripe.js not ready yet — should not happen if the form button
      // stays disabled until both objects are available.
      return;
    }

    setSubmitting(true);
    setError(null);

    // `confirmPayment` resolves with either an error OR a PaymentIntent.
    // Setting `redirect: 'if_required'` keeps the user on KeyHome unless a
    // 3DS challenge mandates a redirect (then Stripe handles it).
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      setError(
        result.error.message ??
          'Une erreur est survenue lors du paiement. Réessayez.'
      );
      setSubmitting(false);
      return;
    }

    if (
      result.paymentIntent &&
      (result.paymentIntent.status === 'succeeded' ||
        result.paymentIntent.status === 'processing')
    ) {
      onSuccess();
      return;
    }

    // Fallback : Stripe accepted but the intent is in a weird state. Show
    // a generic message and let the user retry.
    setError(
      "Le paiement n'a pas été finalisé. Vérifiez votre carte ou réessayez."
    );
    setSubmitting(false);
  }, [stripe, elements, onSuccess]);

  if (loadError) {
    return (
      <PaymentConfigError
        title="Impossible de charger le formulaire"
        message={loadError}
        onBack={onBack}
      />
    );
  }

  return (
    <Box>
      {amountLabel && (
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            color: 'text.secondary',
            letterSpacing: 1.5,
            fontSize: '0.65rem',
            fontWeight: 700,
            mb: 1,
          }}
        >
          {amountLabel}
        </Typography>
      )}

      <Box sx={{ mb: 2, minHeight: 64 }}>
        {/* Stripe injects an iframe here — height is computed by Stripe. */}
        {!elementReady && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2,
            }}
          >
            <CircularProgress size={24} sx={{ color: brand.primary }} />
          </Box>
        )}
        <PaymentElement
          options={{
            // Tabs layout surfaces every method enabled in the Stripe
            // Dashboard that's eligible for the visitor's region/currency
            // (Card, Apple Pay, Google Pay, SEPA, Bancontact, iDEAL, Cash
            // App Pay, Link, Klarna…).
            layout: 'tabs',
            // Prefill the billing country from the geo-derived `kh_country`
            // cookie. Drives BOTH the country selector AND the dynamic
            // method offering — Stripe shows iDEAL when country=NL,
            // Bancontact when country=BE, only card when country=CM, etc.
            // The user can always change it manually if their card is
            // issued in another country.
            defaultValues: {
              billingDetails: {
                address: {
                  country: defaultCountry,
                },
              },
            },
            // We do NOT restrict address fields : SEPA needs an IBAN +
            // name, Klarna may require a full address for credit checks,
            // Cash App Pay needs a phone, etc. Letting Stripe own the
            // form keeps us forward-compatible as new methods land.
          }}
          onReady={() => setElementReady(true)}
          onLoadError={(event) => {
            // The SDK exposes `event.error` of type `StripeError`. The
            // `message` is end-user safe (Stripe localises it) but the
            // 401 case has a generic message. Fall back to a clearer
            // French copy that hints at the most likely cause.
            const stripeMessage = event.error?.message;
            const friendly =
              stripeMessage && stripeMessage !== 'An unknown error occurred.'
                ? stripeMessage
                : "Impossible d'initialiser le formulaire de paiement. V\u00e9rifiez votre connexion ou d\u00e9sactivez les bloqueurs de publicit\u00e9, puis r\u00e9essayez.";
            setLoadError(friendly);
          }}
        />
      </Box>

      {error && (
        <Typography
          variant="body2"
          sx={{
            color: '#D32F2F',
            bgcolor: 'rgba(211,47,47,0.08)',
            p: 1.25,
            borderRadius: 2,
            mb: 1.5,
            fontSize: '0.85rem',
          }}
          role="alert"
        >
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={submitting}
            sx={{ flex: 1, py: 1.4, borderRadius: 3, fontWeight: 600 }}
          >
            Retour
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!stripe || !elements || !elementReady || submitting}
          sx={{
            flex: 2,
            py: 1.4,
            borderRadius: 3,
            fontWeight: 700,
            bgcolor: brand.primary,
            '&:hover': { bgcolor: brand.primaryDark },
            '&:disabled': {
              bgcolor: brand.primaryAlpha30,
              color: 'rgba(255,255,255,0.5)',
            },
          }}
        >
          {submitting ? (
            <CircularProgress
              size={20}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            />
          ) : (
            'Payer maintenant'
          )}
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1.5,
          textAlign: 'center',
          color: 'text.disabled',
          fontSize: '0.7rem',
        }}
      >
        Paiement sécurisé via Stripe · Aucune donnée carte stockée par KeyHome
      </Typography>
    </Box>
  );
}
