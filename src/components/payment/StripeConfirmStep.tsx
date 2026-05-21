'use client';

import { COUNTRY_COOKIE } from '@/lib/currency';
import { getStripePromise } from '@/lib/stripe';
import { readCheckoutSessionTotalAmount } from '@/lib/stripe-checkout-total';
import { brand } from '@/theme/tokens';
import ErrorIcon from '@mui/icons-material/Error';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Typography,
} from '@mui/material';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  CheckoutElementsProvider,
  PaymentElement as CheckoutPaymentElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
   * HTTPS URL Stripe redirects to after PayPal, Bancontact, or other
   * redirect-based PMs (`confirmPayment` requirement).
   */
  paymentConfirmReturnUrl: string;
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
  /**
   * When `true`, render the "Sauvegarder pour mes prochains paiements"
   * checkbox under the Stripe form. The actual server-side wiring
   * (`setup_future_usage`) happens at PaymentIntent creation time — this
   * prop only controls the visual feedback to the user. The PaymentIntent
   * was already created with the same flag when the parent submitted.
   */
  showSaveCheckbox?: boolean;
  /** Initial checkbox state. Defaults to `true` (best UX). */
  defaultSaveCheckbox?: boolean;
  /** Called whenever the checkbox toggles. */
  onSaveCheckboxChange?: (next: boolean) => void;
  /**
   * When set, the user is reusing a previously saved card. The step
   * skips the full Stripe Elements form and goes straight to
   * `stripe.confirmCardPayment(clientSecret)` so Stripe can drive the
   * 3DS challenge on the same PaymentIntent (returned with status
   * `requires_action`).
   */
  reuseSavedPaymentMethodId?: string | null;
  /**
   * Auto-confirm on mount instead of waiting for the user to click. Used
   * when the saved-card initiate response was `requires_action` — the
   * 3DS overlay must flash open immediately so the user understands
   * why the bank popup appeared.
   */
  autoConfirmOnMount?: boolean;
  /**
   * Which Stripe SDK flow `clientSecret` belongs to.
   *  - `'checkout_session'` → mount `CheckoutElementsProvider` + `checkout.confirm()`
   *  - `'payment_intent'` (default) → mount `<Elements>` + `stripe.confirmPayment()`
   */
  stripeFlow?: 'checkout_session' | 'payment_intent';
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
  paymentConfirmReturnUrl,
  onSuccess,
  onBack,
  amountLabel,
  showSaveCheckbox = false,
  defaultSaveCheckbox = true,
  onSaveCheckboxChange,
  reuseSavedPaymentMethodId = null,
  autoConfirmOnMount = false,
  stripeFlow = 'payment_intent',
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
        message="La clé publique Stripe n’est pas configurée. Choisissez Mobile Money ou contactez le support."
        onBack={onBack}
      />
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: brand.primary,
      colorBackground: '#ffffff',
      colorText: '#0A1628',
      borderRadius: '10px',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  };

  if (stripeFlow === 'checkout_session') {
    return (
      <CheckoutElementsProvider
        stripe={stripePromise}
        options={{
          clientSecret,
          elementsOptions: {
            appearance,
            loader: 'auto',
          },
        }}
      >
        <CheckoutConfirmInner
          paymentConfirmReturnUrl={paymentConfirmReturnUrl}
          onSuccess={onSuccess}
          onBack={onBack}
          amountLabel={amountLabel}
          showSaveCheckbox={showSaveCheckbox}
          defaultSaveCheckbox={defaultSaveCheckbox}
          onSaveCheckboxChange={onSaveCheckboxChange}
        />
      </CheckoutElementsProvider>
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
        appearance,
        loader: 'auto',
      }}
    >
      <StripeConfirmInner
        clientSecret={clientSecret}
        paymentConfirmReturnUrl={paymentConfirmReturnUrl}
        onSuccess={onSuccess}
        onBack={onBack}
        amountLabel={amountLabel}
        defaultCountry={visitorCountry}
        showSaveCheckbox={showSaveCheckbox}
        defaultSaveCheckbox={defaultSaveCheckbox}
        onSaveCheckboxChange={onSaveCheckboxChange}
        reuseSavedPaymentMethodId={reuseSavedPaymentMethodId}
        autoConfirmOnMount={autoConfirmOnMount}
      />
    </Elements>
  );
}

interface CheckoutConfirmInnerProps {
  paymentConfirmReturnUrl: string;
  onSuccess: () => void;
  onBack?: () => void;
  amountLabel?: string;
  showSaveCheckbox: boolean;
  defaultSaveCheckbox: boolean;
  onSaveCheckboxChange?: (next: boolean) => void;
}

/**
 * Inner form for the Checkout Session (`ui_mode: 'custom'`) flow.
 * Must be rendered inside `<CheckoutElementsProvider>`.
 */
function CheckoutConfirmInner({
  paymentConfirmReturnUrl,
  onSuccess,
  onBack,
  amountLabel,
  showSaveCheckbox,
  defaultSaveCheckbox,
  onSaveCheckboxChange,
}: CheckoutConfirmInnerProps): React.ReactElement {
  const result = useCheckoutElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);
  const [saveChecked, setSaveChecked] = useState<boolean>(defaultSaveCheckbox);

  const checkoutTotalAmount =
    result.type === 'success'
      ? readCheckoutSessionTotalAmount(result.checkout)
      : null;
  const canConfirm =
    result.type === 'success' ? result.checkout.canConfirm : false;

  const handleSubmit = useCallback(async () => {
    if (result.type !== 'success') {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // `return_url` is already set server-side when the Checkout Session is
      // created. Passing `returnUrl` here again would throw:
      //   "You cannot provide returnUrl to confirm() when return_url was
      //    already provided when creating the Checkout Session."
      const confirmResult = await result.checkout.confirm({
        redirect: 'if_required',
      });

      if (confirmResult.type === 'error') {
        setError(
          confirmResult.error.message ??
            'Une erreur est survenue lors du paiement. Réessayez.'
        );

        return;
      }

      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors du paiement. Réessayez.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [result, onSuccess]);

  const handleSaveCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      setSaveChecked(next);
      onSaveCheckboxChange?.(next);
    },
    [onSaveCheckboxChange]
  );

  if (result.type === 'error') {
    return (
      <PaymentConfigError
        title="Impossible de charger le formulaire"
        message={result.error.message}
        onBack={onBack}
      />
    );
  }

  const isLoading = result.type === 'loading';
  // Prefer the local amountLabel (XAF/FCFA) over Stripe's EUR total.
  // The backend converts XAF→EUR for Stripe; showing EUR to a CHF/XAF user is misleading.
  const displayedTotal = amountLabel ?? checkoutTotalAmount ?? null;

  return (
    <Box>
      {displayedTotal && (
        <Typography
          variant="overline"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
            letterSpacing: 1.5,
            fontSize: '0.65rem',
            fontWeight: 700,
            mb: 1,
          }}
        >
          {amountLabel ??
            (checkoutTotalAmount !== null
              ? `Total à payer : ${checkoutTotalAmount}`
              : null)}
        </Typography>
      )}

      <Box sx={{ mb: 2, minHeight: 64 }}>
        {(isLoading || !elementReady) && (
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
        <CheckoutPaymentElement
          options={{ layout: 'tabs' }}
          onReady={() => setElementReady(true)}
        />
      </Box>

      {showSaveCheckbox && (
        <FormControlLabel
          control={
            <Checkbox
              checked={saveChecked}
              onChange={handleSaveCheckboxChange}
              sx={{
                color: 'text.secondary',
                '&.Mui-checked': { color: brand.primary },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              Sauvegarder pour mes prochains paiements
            </Typography>
          }
          sx={{ mb: 1, mr: 0 }}
        />
      )}

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
            color="inherit"
            onClick={onBack}
            disabled={submitting}
            sx={{
              flex: 1,
              py: 1.4,
              borderRadius: 3,
              fontWeight: 600,
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            Retour
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || submitting || !elementReady || !canConfirm}
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
          ) : amountLabel ? (
            `Payer ${amountLabel}`
          ) : checkoutTotalAmount !== null ? (
            `Payer ${checkoutTotalAmount}`
          ) : (
            'Payer maintenant'
          )}
        </Button>
      </Box>
    </Box>
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
  clientSecret: string;
  paymentConfirmReturnUrl: string;
  onSuccess: () => void;
  onBack?: () => void;
  amountLabel?: string;
  /** ISO 3166-1 alpha-2 country code prefilled in the billing form. */
  defaultCountry: string;
  showSaveCheckbox: boolean;
  defaultSaveCheckbox: boolean;
  onSaveCheckboxChange?: (next: boolean) => void;
  reuseSavedPaymentMethodId: string | null;
  autoConfirmOnMount: boolean;
}

function StripeConfirmInner({
  clientSecret,
  paymentConfirmReturnUrl,
  onSuccess,
  onBack,
  amountLabel,
  defaultCountry,
  showSaveCheckbox,
  defaultSaveCheckbox,
  onSaveCheckboxChange,
  reuseSavedPaymentMethodId,
  autoConfirmOnMount,
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
  const [saveChecked, setSaveChecked] = useState<boolean>(defaultSaveCheckbox);
  // Guards `autoConfirmOnMount` so the effect runs exactly once, even if
  // React StrictMode double-invokes the mount effect in dev.
  const autoConfirmedRef = useRef(false);

  const isReusing = reuseSavedPaymentMethodId !== null;

  const handleSubmit = useCallback(async () => {
    if (!stripe) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Branch A — Reusing a saved card. The PaymentIntent was already
      // created server-side with `payment_method = pm_xxx`, `confirm =
      // true`, `off_session = true`. If the bank accepted, Stripe returned
      // status `succeeded` and we're not here. If the bank requires 3DS,
      // status is `requires_action` and we drive the challenge through
      // `confirmCardPayment` on the same intent.
      if (isReusing) {
        const result = await stripe.confirmCardPayment(clientSecret, {
          return_url: paymentConfirmReturnUrl,
        });
        if (result.error) {
          setError(
            result.error.message ??
              'Une erreur est survenue lors du paiement. Réessayez.'
          );

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
        setError(
          "Le paiement n'a pas été finalisé. Vérifiez votre carte ou réessayez."
        );

        return;
      }

      // Branch B — New card via the PaymentElement form (legacy PaymentIntent).
      if (!elements) {
        setError(
          "Le formulaire de paiement n'est pas prêt. Patientez un instant puis réessayez."
        );

        return;
      }

      const submitResult = await elements.submit();
      if (submitResult.error) {
        setError(
          submitResult.error.message ??
            'Vérifiez les informations de paiement saisies.'
        );

        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
        confirmParams: {
          return_url: paymentConfirmReturnUrl,
        },
      });

      if (result.error) {
        setError(
          result.error.message ??
            'Une erreur est survenue lors du paiement. Réessayez.'
        );

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

      setError(
        "Le paiement n'a pas été finalisé. Vérifiez votre carte ou réessayez."
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors du paiement. Réessayez.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    stripe,
    elements,
    onSuccess,
    isReusing,
    clientSecret,
    paymentConfirmReturnUrl,
  ]);

  // Auto-trigger the 3DS challenge as soon as Stripe.js is ready when the
  // parent flagged `autoConfirmOnMount`. The bank popup must feel like a
  // continuation of the previous click, not a manual confirmation.
  useEffect(() => {
    if (
      autoConfirmOnMount &&
      isReusing &&
      stripe !== null &&
      !autoConfirmedRef.current
    ) {
      autoConfirmedRef.current = true;
      void handleSubmit();
    }
  }, [autoConfirmOnMount, isReusing, stripe, handleSubmit]);

  const handleSaveCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      setSaveChecked(next);
      onSaveCheckboxChange?.(next);
    },
    [onSaveCheckboxChange]
  );

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
            textAlign: 'center',
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

      {isReusing ? (
        // Saved card reuse — Stripe is driving 3DS in an iframe / popup.
        // The PaymentElement is not rendered; we just show a calming
        // status block while the bank challenge runs.
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            bgcolor: brand.primaryAlpha10,
          }}
        >
          <CircularProgress size={22} sx={{ color: brand.primary }} />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Validation en cours par votre banque
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25 }}
            >
              Suivez les instructions affichées par votre banque pour finaliser
              le paiement.
            </Typography>
          </Box>
        </Box>
      ) : (
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
      )}

      {showSaveCheckbox && !isReusing && (
        <FormControlLabel
          control={
            <Checkbox
              checked={saveChecked}
              onChange={handleSaveCheckboxChange}
              sx={{
                color: 'text.secondary',
                '&.Mui-checked': { color: brand.primary },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              Sauvegarder pour mes prochains paiements
            </Typography>
          }
          sx={{ mb: 1, mr: 0 }}
        />
      )}

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
            color="inherit"
            onClick={onBack}
            disabled={submitting}
            sx={{
              flex: 1,
              py: 1.4,
              borderRadius: 3,
              fontWeight: 600,
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            Retour
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !stripe ||
            submitting ||
            // For new cards, wait until Elements is ready. For saved-card
            // reuse, the form is hidden so the readiness gate doesn't
            // apply.
            (!isReusing && (!elements || !elementReady))
          }
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
          ) : isReusing ? (
            'Confirmer le paiement'
          ) : (
            'Payer maintenant'
          )}
        </Button>
      </Box>
    </Box>
  );
}
