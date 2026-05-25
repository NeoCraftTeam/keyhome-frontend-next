'use client';

import TurnstileConfigAlert from '@/components/auth/TurnstileConfigAlert';
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import SavedCardPicker from '@/components/payment/SavedCardPicker';
import StripeConfirmStep from '@/components/payment/StripeConfirmStep';
import VerifyingView from '@/components/payment/return/VerifyingView';
import { usePayment } from '@/hooks/usePayment';
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import {
  trackInitiatePayment,
  trackUnlockAd,
} from '@/lib/analytics/track-events';
import { creditsKeys, paymentKeys } from '@/lib/query-keys';
import { buildStripeConfirmReturnUrl } from '@/lib/payment/stripe-confirm-return';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrency } from '@/providers/CurrencyProvider';
import { paymentsService } from '@/services/payments.service';
import { brand } from '@/theme/tokens';
import {
  type FlutterwaveInitiatePayload,
  PaymentMethod,
  type PaymentMethodInfo,
  PaymentType,
  type StripePaymentMethod,
} from '@/types';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import Toll from '@mui/icons-material/Toll';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Extracts the 9-digit Cameroon local phone number from a profile value that
 * may include the +237 country prefix (e.g. "+237650000000" → "650000000").
 * Returns an empty string when the value cannot be normalised to 9 digits.
 */
function extractCamPhoneDigits(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('237')) {
    return digits.slice(3);
  }
  if (digits.length === 9) return digits;
  return '';
}

/**
 * Shared transition config for step changes. A soft slide + fade —
 * neither distracting nor instant. Tuned to feel like a premium fintech
 * flow (Revolut / Stripe checkout) rather than a brutal state swap.
 */
const STEP_MOTION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

/**
 * Cameroon phone number: must start with 6, 7 or 2, 9 digits total.
 * Used for Mobile Money & Orange Money verification before sending to
 * `POST /payments/initiate_payment`.
 */
const PHONE_REGEX = /^(6|7|2)\d{8}$/;

function methodRequiresPhone(_method: PaymentMethod | null): boolean {
  return false;
}

type Step =
  | 'select-method'
  | 'credit-turnstile'
  | 'enter-phone'
  | 'pick-card'
  | 'loading'
  | 'stripe-confirm'
  | 'verifying'
  | 'done-success'
  | 'done-error';

interface PaymentFlowProps {
  /** Amount in XAF (canonical). */
  amount: number;
  /** Payment domain (unlock / credit / subscription / boost). */
  type: PaymentType;
  /** Optional ad / agency / plan ids forwarded to the backend payload. */
  adId?: string | null;
  agencyId?: string | null;
  planId?: string | null;
  period?: 'monthly' | 'yearly' | null;
  /**
   * Called when the server has accepted the payment and verification ran
   * (Stripe in-page flows). Use to refresh balance / UI. Not invoked for
   * Flutterwave hosted checkout — the user leaves the app before confirmation.
   */
  onSuccess?: () => void;
  /**
   * Optional: shown on the in-modal success step (Stripe). When set, a primary
   * "Continuer" button appears so the user dismisses explicitly after reading
   * the confirmation. Flutterwave never reaches this step (redirect). When
   * omitted, the success screen has no CTA (parent may still close via dialog X).
   */
  onProceedAfterSuccess?: () => void;
  /**
   * Called when the user clicks the back/cancel control on the FIRST step
   * (select-method). When omitted, the back button is hidden — useful when
   * the parent dialog already provides its own close affordance.
   */
  onBack?: () => void;
  /**
   * When true with a non-empty `creditTurnstileSiteKey`, credit purchases show
   * Cloudflare Turnstile after the user picks a payment method and before
   * `initiate_payment`. Propagate `GET /api/v1/config/turnstile` →
   * `show_credits_turnstile` (true in `local` / `testing` with dummy site keys
   * so the UX matches production; API verification stays fail-open until a
   * real secret is configured).
   */
  creditTurnstileVerificationRequired?: boolean;
  creditTurnstileSiteKey?: string | null;
}

/**
 * Inline payment flow — same UX as `<PaymentModal>` but rendered directly in
 * the parent (no nested Dialog). Handles :
 *  1. fetch the admin-gated catalogue (`GET /payments/methods`)
 *  2. let the user pick a method
 *  3. mobile money → ask phone number → POST initiate → redirect Flutterwave
 *  4. carte → POST initiate → mount Stripe `<Elements>` in-page → confirm
 *
 * Use `<PaymentModal>` when you want this flow popped over the current page,
 * or `<PaymentFlow>` directly when you want it embedded inside an existing
 * stepper (e.g. the credits-purchase modal).
 */
export default function PaymentFlow({
  amount: _amount,
  type,
  adId = null,
  agencyId = null,
  planId = null,
  period = null,
  onSuccess,
  onProceedAfterSuccess,
  onBack,
  creditTurnstileVerificationRequired = false,
  creditTurnstileSiteKey = null,
}: PaymentFlowProps): React.ReactElement {
  const { user } = useAuth();
  const { format: formatAmount } = useCurrency();
  const profilePhone = extractCamPhoneDigits(user?.phone_number);

  // Formatted in the user's display currency (CHF, EUR, XAF…) — passed to
  // StripeConfirmStep so the button never shows the backend-converted EUR total.
  const amountLabel = formatAmount(_amount);

  const [step, setStep] = useState<Step>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodInfo[] | null
  >(null);
  // Saved Stripe cards (only fetched once the user picks the "Carte
  // bancaire" method). Stays `null` until the request resolves so the UI
  // can distinguish "loading" from "user has no saved cards".
  const [savedCards, setSavedCards] = useState<StripePaymentMethod[] | null>(
    null
  );
  // ID of the saved card the user picked at the "pick-card" step (`null`
  // when they chose "Nouvelle carte" or never had any).
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(
    null
  );
  // Whether the user wants to save the new card they're about to enter.
  // Bubbled to `<StripeConfirmStep>` via the `defaultSave` prop.
  const [wantsSaveCard, setWantsSaveCard] = useState<boolean>(true);
  // Captured from the initiate response. Powers verify / cancel calls
  // and survives the Stripe Elements step. `null` until we have a live
  // server-side Payment row.
  const [txRef, setTxRef] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // Updated `point_balance` returned by the polling endpoint once the
  // payment is confirmed (credit purchases only). Surfaces on the success
  // screen so the user sees the new total without having to re-fetch.
  const [confirmedBalance, setConfirmedBalance] = useState<number | null>(null);
  const [creditTurnstileToken, setCreditTurnstileToken] = useState<
    string | null
  >(null);
  const [creditTurnstileError, setCreditTurnstileError] = useState('');
  const [creditTurnstileIssueCode, setCreditTurnstileIssueCode] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();

  const needsCreditTurnstileGate =
    type === PaymentType.CREDIT &&
    creditTurnstileVerificationRequired &&
    typeof creditTurnstileSiteKey === 'string' &&
    creditTurnstileSiteKey.trim() !== '';

  // NOTE: do NOT memoise the return URL with `txRef` in the dep list —
  // we need it built at the moment of redirect (after `setTxRef(result.tx_ref)`
  // has been queued) using the freshest `tx_ref`. Pass the tx_ref explicitly
  // through the helper below.
  const buildReturnUrlFor = useCallback(
    (txRefValue: string | null): string =>
      buildStripeConfirmReturnUrl({
        paymentType: type,
        txRef: txRefValue,
        adId,
      }),
    [type, adId]
  );

  // In-modal verification polling. Mirrors the standalone `/payment/return`
  // page behaviour but renders inside the dialog so the user never leaves
  // the purchase flow. Only enabled while the `verifying` step is active
  // — `skip` flips to `true` for every other step so the hook tears down
  // its timers cleanly when the user dismisses or restarts the flow.
  const pollingVariant: 'credit' | 'unlock' =
    type === PaymentType.CREDIT ? 'credit' : 'unlock';

  const handlePollSuccess = useCallback(() => {
    if (type === PaymentType.UNLOCK && adId) {
      trackUnlockAd(adId, _amount);
    }
    onSuccess?.();
    // Force React Query to refetch the balance widget in the rest of the
    // app (CreditsWidget, header, etc.) so the user sees the new total
    // everywhere once they dismiss the modal.
    void queryClient.invalidateQueries({ queryKey: creditsKeys.balance });
    void queryClient.invalidateQueries({ queryKey: creditsKeys.all });
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  }, [onSuccess, queryClient, type, adId, _amount]);

  const {
    initiatePayment,
    isLoading,
    error,
    resetPayment,
    stripeClientSecret,
    stripeInitialStatus,
    stripeFlow,
  } = usePayment();

  const { state: pollState, pointBalance: polledBalance } =
    usePaymentStatusPolling({
      txRef,
      variant: pollingVariant,
      skip: step !== 'verifying',
      onSuccess: handlePollSuccess,
    });

  // Mirror the polled balance into local state so the success screen keeps
  // showing it after the polling hook is torn down (`skip` flips to true
  // once we leave the verifying step).
  useEffect(() => {
    if (polledBalance !== null) {
      setConfirmedBalance(polledBalance);
    }
  }, [polledBalance]);

  // Drive the step machine from the polling outcome. Terminal polling
  // states map to the modal's terminal screens — success/failure UI is
  // rendered inline so the user never sees a blank dialog while we wait
  // for `setStep` to run.
  useEffect(() => {
    if (step !== 'verifying') {
      return;
    }
    if (pollState === 'success' || pollState === 'auth_lost') {
      setStep('done-success');
      return;
    }
    if (pollState === 'failed' || pollState === 'cancelled') {
      setVerifyError(
        pollState === 'cancelled'
          ? 'Le paiement a été annulé.'
          : "Le paiement n'a pas abouti. Aucun montant n'a été débité."
      );
      setStep('done-error');
    }
  }, [pollState, step]);

  // Mount : fetch admin-gated catalogue (cached server-side, safe on every mount).
  useEffect(() => {
    paymentsService
      .fetchAvailableMethods()
      .then((methods) => setAvailableMethods(methods))
      .catch(() => setAvailableMethods([]));
  }, []);

  // Cleanup : if the parent unmounts (e.g. user closes the dialog) while a
  // Stripe PaymentIntent is awaiting confirmation, mark the local payment
  // as cancelled. Best-effort fire-and-forget — a stale PaymentIntent will
  // also auto-expire on the Stripe side, but cleaning up our DB row keeps
  // the user's payment history honest.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    return () => {
      if (
        txRef &&
        (stepRef.current === 'stripe-confirm' ||
          stepRef.current === 'enter-phone')
      ) {
        // Fire-and-forget. Errors are non-fatal here.
        paymentsService.cancel(txRef).catch(() => undefined);
      }
    };
    // We only want this to run on unmount; txRef is read via closure but
    // the latest value is captured because the effect re-registers on change.
  }, [txRef]);

  const submit = useCallback(
    async (
      method: PaymentMethod,
      phoneNumber: string | null,
      stripeOpts: {
        savedCardId?: string | null;
        savePaymentMethod?: boolean;
      } = {}
    ) => {
      setStep('loading');
      setVerifyError(null);

      const payload: FlutterwaveInitiatePayload = {
        type: type as FlutterwaveInitiatePayload['type'],
        payment_method: method as FlutterwaveInitiatePayload['payment_method'],
        ...(phoneNumber && { phone_number: `+237${phoneNumber}` }),
        ...(adId && { ad_id: adId }),
        ...(agencyId && { agency_id: agencyId }),
        ...(planId && { plan_id: planId }),
        ...(period && { period }),
        ...(type === PaymentType.CREDIT &&
          typeof creditTurnstileToken === 'string' &&
          creditTurnstileToken.trim() !== '' && {
            turnstile_token: creditTurnstileToken.trim(),
          }),
        ...(stripeOpts.savePaymentMethod && {
          save_payment_method: true,
        }),
        ...(stripeOpts.savedCardId && {
          payment_method_id: stripeOpts.savedCardId,
        }),
      };

      const result = await initiatePayment(payload);

      if (!result) {
        // Initiation failed — the hook populated `error` ; surface it.
        setStep('done-error');
        return;
      }

      setTxRef(result.tx_ref);
      trackInitiatePayment(adId ?? '', _amount);

      if (result.gateway === 'stripe') {
        // Saved-card off-session charges can short-circuit through Stripe
        // without ever mounting Elements:
        //  - `success` → jump straight to verify (skip <Elements>).
        //  - `failed`  → surface the error.
        //  - `requires_action` → fall through and let Stripe Elements
        //    pick up the 3DS challenge via the returned client secret.
        //  - `pending` (new card) → mount Elements normally.
        if (result.status === 'success') {
          // Off-session saved-card charge cleared without 3DS. Stay inside
          // the modal and run the same verify-then-confirm UX as the
          // unified `/payment/return` page (polished verifying view +
          // balance refresh + in-modal success screen). No more navigation
          // — the user never leaves the purchase flow.
          setStep('verifying');
          return;
        }
        if (result.status === 'failed') {
          setStep('done-error');
          return;
        }
        // requires_action OR pending → render <StripeConfirmStep>.
        setStep('stripe-confirm');
        return;
      }

      // Flutterwave : `usePayment` navigates away synchronously — keep the
      // loading step until the document unloads (no intermediate UI).
    },
    [
      type,
      adId,
      agencyId,
      planId,
      period,
      initiatePayment,
      creditTurnstileToken,
      _amount,
    ]
  );

  const clearTurnstileAndGoToMethodSelect = useCallback(() => {
    setCreditTurnstileToken(null);
    setCreditTurnstileError('');
    setCreditTurnstileIssueCode(null);
    setStep('select-method');
  }, []);

  const proceedFromMethodConfirmed = useCallback(async () => {
    if (!selectedMethod) return;
    if (methodRequiresPhone(selectedMethod)) {
      // Pre-fill with the profile phone when available and the field is still empty.
      if (profilePhone && !phone) {
        setPhone(profilePhone);
      }
      setStep('enter-phone');
      return;
    }

    // Card method: try to fetch saved Stripe cards FIRST so we can show
    // the picker step instead of jumping straight to a fresh Elements
    // form. Fail-open: any API error → behave as if the user had no
    // saved card. The fetch is gated to authenticated users only — the
    // backend rejects guests with 401 anyway.
    if (selectedMethod === PaymentMethod.CARD && user) {
      setStep('loading');
      try {
        const cards = await paymentsService.listStripePaymentMethods();
        setSavedCards(cards);
        if (cards.length > 0) {
          // Default to the user-marked default card when present, else
          // the first one.
          const defaultCard = cards.find((c) => c.is_default) ?? cards[0];
          setSelectedSavedCardId(defaultCard?.id ?? null);
          setStep('pick-card');
          return;
        }
      } catch {
        // Network / not configured — fall through to the new-card flow.
        setSavedCards([]);
      }
    }

    // No saved cards (or non-card method): trigger the initiate call
    // directly. Mobile money: forward the profile phone if available.
    const phoneArg =
      selectedMethod === PaymentMethod.MOBILE_MONEY
        ? profilePhone || null
        : null;
    submit(selectedMethod, phoneArg);
  }, [selectedMethod, submit, profilePhone, phone, user]);

  const handleMethodConfirm = useCallback(() => {
    if (!selectedMethod) return;
    if (
      needsCreditTurnstileGate &&
      (!creditTurnstileToken || !creditTurnstileToken.trim())
    ) {
      setCreditTurnstileError('');
      setCreditTurnstileIssueCode(null);
      setStep('credit-turnstile');
      return;
    }
    void proceedFromMethodConfirmed();
  }, [
    selectedMethod,
    needsCreditTurnstileGate,
    creditTurnstileToken,
    proceedFromMethodConfirmed,
  ]);

  const handleCreditTurnstileContinue = useCallback(() => {
    if (!creditTurnstileToken?.trim()) {
      setCreditTurnstileError('Validez le contrôle avant de continuer.');
      return;
    }
    setCreditTurnstileError('');
    void proceedFromMethodConfirmed();
  }, [creditTurnstileToken, proceedFromMethodConfirmed]);

  const handlePickedSavedCard = useCallback(
    (savedCardId: string | null) => {
      if (!selectedMethod) return;
      if (savedCardId === null) {
        // "Nouvelle carte" path → reset the save toggle to the default
        // and continue to <StripeConfirmStep> with no payment_method_id.
        setSelectedSavedCardId(null);
        submit(selectedMethod, null, { savePaymentMethod: wantsSaveCard });
      } else {
        // Reuse the saved card → off-session charge.
        setSelectedSavedCardId(savedCardId);
        submit(selectedMethod, null, { savedCardId });
      }
    },
    [selectedMethod, submit, wantsSaveCard]
  );

  const handlePhoneConfirm = useCallback(() => {
    const cleaned = phone.trim();
    if (!PHONE_REGEX.test(cleaned)) {
      setPhoneError('Numéro invalide. Format attendu : 6xxxxxxxx (9 chiffres)');
      return;
    }
    setPhoneError('');
    submit(selectedMethod!, cleaned);
  }, [phone, selectedMethod, submit]);

  // After Stripe.confirmPayment succeeds, switch the modal to the
  // in-place verification step. `usePaymentStatusPolling` then drives the
  // transition to `'done-success'` (or `'done-error'`) once our backend
  // confirms the PaymentIntent — even if the webhook lands first, the
  // verify call is idempotent (PaymentObserver + HandlePostPaymentActions
  // guard against double-credit via row locks).
  const handleStripeSuccess = useCallback(() => {
    setStep('verifying');
  }, []);

  const handleStripeCancel = useCallback(() => {
    if (txRef) {
      // Fire-and-forget : the user is going back to method selection,
      // there's no point blocking the UI on the cancel call.
      paymentsService.cancel(txRef).catch(() => undefined);
    }
    resetPayment();
    setTxRef(null);
    setSelectedSavedCardId(null);
    // When the user had saved cards, go back to the picker (one tap to
    // pick another card) rather than the method selector — better UX.
    if (savedCards && savedCards.length > 0) {
      setStep('pick-card');
    } else {
      clearTurnstileAndGoToMethodSelect();
    }
  }, [txRef, resetPayment, savedCards, clearTurnstileAndGoToMethodSelect]);

  // ─── render ────────────────────────────────────────────────────────────

  if (step === 'credit-turnstile') {
    const siteKeyTrimmed =
      typeof creditTurnstileSiteKey === 'string'
        ? creditTurnstileSiteKey.trim()
        : '';

    return (
      <motion.div key="credit-turnstile" {...STEP_MOTION}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              mb: 2,
              width: '100%',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: `${brand.primary}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldOutlined
                sx={{ color: brand.primary, fontSize: 20 }}
                aria-hidden
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  letterSpacing: 1.5,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                Vérification anti-robots
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.4 }}
              >
                Complétez le captcha pour continuer vers le paiement.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: '100%' }}>
            <TurnstileConfigAlert code={creditTurnstileIssueCode} />
          </Box>

          {creditTurnstileError ? (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mb: 1.5, width: '100%' }}
            >
              {creditTurnstileError}
            </Typography>
          ) : null}

          {siteKeyTrimmed !== '' ? (
            <Box
              sx={{
                mb: 2,
                minHeight: 65,
                width: 'fit-content',
                maxWidth: '100%',
              }}
            >
              <TurnstileWidget
                siteKey={siteKeyTrimmed}
                action="purchase-credits"
                onToken={(tok) => {
                  setCreditTurnstileToken(tok);
                  setCreditTurnstileError('');
                  setCreditTurnstileIssueCode(null);
                }}
                onExpire={() => {
                  setCreditTurnstileToken(null);
                }}
                onErrorCode={(code) => {
                  setCreditTurnstileToken(null);
                  setCreditTurnstileIssueCode(code);
                }}
              />
            </Box>
          ) : (
            <Box sx={{ mb: 2, width: '100%' }}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                La clé publique Turnstile est indisponible. Vérifiez la
                configuration du backend et rechargez la page.
              </Alert>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              alignItems: 'center',
              justifyContent: 'flex-start',
              mt: 2.5,
              width: '100%',
            }}
          >
            <Button
              variant="outlined"
              onClick={clearTurnstileAndGoToMethodSelect}
              sx={{
                flex: '0 0 auto',
                py: 1.4,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              disabled={!creditTurnstileToken?.trim()}
              onClick={handleCreditTurnstileContinue}
              sx={{
                flex: '0 0 auto',
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
              Continuer
            </Button>
          </Box>
        </Box>
      </motion.div>
    );
  }

  if (step === 'select-method') {
    return (
      <motion.div key="select-method" {...STEP_MOTION}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              letterSpacing: 1.5,
              fontSize: '0.65rem',
              fontWeight: 700,
              mb: 1.5,
            }}
          >
            Choisir un mode de paiement
          </Typography>

          <PaymentMethodSelector
            selected={selectedMethod}
            onChange={setSelectedMethod}
            availableMethods={availableMethods}
          />

          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            {onBack && (
              <Button
                variant="outlined"
                onClick={onBack}
                sx={{ flex: 1, py: 1.4, borderRadius: 3, fontWeight: 600 }}
              >
                Retour
              </Button>
            )}
            <Button
              variant="contained"
              disabled={!selectedMethod || isLoading}
              onClick={handleMethodConfirm}
              sx={{
                flex: onBack ? 2 : 1,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '0.95rem',
                bgcolor: brand.primary,
                '&:hover': { bgcolor: brand.primaryDark },
                '&:disabled': {
                  bgcolor: brand.primaryAlpha30,
                  color: 'rgba(255,255,255,0.5)',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress
                  size={22}
                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                />
              ) : (
                'Continuer'
              )}
            </Button>
          </Box>
        </Box>
      </motion.div>
    );
  }

  if (step === 'enter-phone') {
    const isUsingProfilePhone = Boolean(profilePhone && phone === profilePhone);

    return (
      <motion.div key="enter-phone" {...STEP_MOTION}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              letterSpacing: 1.5,
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          >
            Numéro de téléphone
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 2 }}
          >
            Entrez le numéro associé à votre compte{' '}
            {selectedMethod === PaymentMethod.MOBILE_MONEY
              ? 'MTN MoMo'
              : 'Orange Money'}
            .
          </Typography>
          <TextField
            fullWidth
            label="Numéro (ex: 650000000)"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ''));
              setPhoneError('');
            }}
            inputProps={{
              maxLength: 9,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
            InputProps={{
              startAdornment: (
                <Typography
                  sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0 }}
                >
                  +237
                </Typography>
              ),
            }}
            error={Boolean(phoneError)}
            helperText={
              phoneError ||
              (isUsingProfilePhone
                ? 'Numéro issu de votre profil · Modifiez-le si besoin'
                : ' ')
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePhoneConfirm();
            }}
          />
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={clearTurnstileAndGoToMethodSelect}
              sx={{ flex: 1, py: 1.4, borderRadius: 3, fontWeight: 600 }}
            >
              Retour
            </Button>
            <Button
              variant="contained"
              disabled={phone.length !== 9 || isLoading}
              onClick={handlePhoneConfirm}
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
              {isLoading ? (
                <CircularProgress
                  size={20}
                  sx={{ color: 'rgba(255,255,255,0.5)' }}
                />
              ) : (
                'Payer maintenant'
              )}
            </Button>
          </Box>
        </Box>
      </motion.div>
    );
  }

  if (step === 'loading') {
    return (
      <motion.div key="loading" {...STEP_MOTION}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ color: brand.primary, mb: 2 }} size={48} />
          <Typography variant="body1" fontWeight={600}>
            Préparation du paiement...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selectedMethod === PaymentMethod.CARD
              ? 'Connexion au formulaire de paiement sécurisé.'
              : 'Vous allez être redirigé vers la page de paiement sécurisé.'}
          </Typography>
        </Box>
      </motion.div>
    );
  }

  if (step === 'pick-card' && savedCards) {
    return (
      <motion.div key="pick-card" {...STEP_MOTION}>
        <SavedCardPicker
          cards={savedCards}
          selectedId={selectedSavedCardId}
          onSelectionChange={setSelectedSavedCardId}
          onContinue={handlePickedSavedCard}
          onBack={clearTurnstileAndGoToMethodSelect}
          isSubmitting={isLoading}
        />
      </motion.div>
    );
  }

  if (step === 'stripe-confirm' && stripeClientSecret) {
    // When reusing a saved card and Stripe asked for a 3DS challenge,
    // pass the `paymentMethodId` so <StripeConfirmStep> calls
    // `confirmCardPayment(clientSecret, { payment_method })` instead of
    // showing the full Elements form.
    const isReusingSavedCard = selectedSavedCardId !== null;
    return (
      <motion.div key="stripe-confirm" {...STEP_MOTION}>
        <StripeConfirmStep
          clientSecret={stripeClientSecret}
          paymentConfirmReturnUrl={buildReturnUrlFor(txRef)}
          onSuccess={handleStripeSuccess}
          onBack={handleStripeCancel}
          stripeFlow={stripeFlow ?? undefined}
          amountLabel={amountLabel}
          // The "save card" checkbox is only meaningful for new cards.
          // For saved-card reuse the card is already attached to the
          // Customer; hide the checkbox to avoid confusing UX.
          showSaveCheckbox={!isReusingSavedCard && Boolean(user)}
          defaultSaveCheckbox={wantsSaveCard}
          onSaveCheckboxChange={setWantsSaveCard}
          // Hint to Stripe — drives `confirmCardPayment` instead of
          // `confirmPayment` on submit, which is required for the
          // `requires_action` (3DS) follow-up on saved cards.
          reuseSavedPaymentMethodId={selectedSavedCardId}
          // Stripe already started processing the saved card; the 3DS
          // overlay needs to flash open immediately.
          autoConfirmOnMount={
            isReusingSavedCard && stripeInitialStatus === 'requires_action'
          }
        />
      </motion.div>
    );
  }

  if (step === 'verifying') {
    return (
      <motion.div key="verifying" {...STEP_MOTION}>
        {/* `VerifyingView` + polling enforce ~4 s minimum dwell so the user
            never sees a sub-second blink between Stripe confirm and success.
            Same component as standalone `/payment/return`. */}
        <VerifyingView variant={pollingVariant} />
      </motion.div>
    );
  }

  if (step === 'done-error') {
    return (
      <motion.div key="done-error" {...STEP_MOTION}>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(211,47,47,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ErrorIcon sx={{ color: '#D32F2F', fontSize: 32 }} />
          </Box>
          <Typography
            variant="body1"
            fontWeight={700}
            color="error"
            gutterBottom
          >
            Une erreur est survenue
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error ?? "Le paiement n'a pas pu être initié."}
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              resetPayment();
              setTxRef(null);
              clearTurnstileAndGoToMethodSelect();
            }}
            sx={{ borderRadius: 3, py: 1.4, fontWeight: 600 }}
          >
            Réessayer
          </Button>
        </Box>
      </motion.div>
    );
  }

  // step === 'done-success' — Stripe payment confirmed and credits/unlock
  // fulfilled server-side. We surface the polled `point_balance` (credit
  // purchases) so the user immediately sees their new total without having
  // to dismiss + reopen the dialog.
  const isCreditFlow = pollingVariant === 'credit';
  return (
    <motion.div key="done-success" {...STEP_MOTION}>
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'rgba(0,138,5,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            animation: 'kh-payflow-scale 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            '@keyframes kh-payflow-scale': {
              '0%': { transform: 'scale(0)', opacity: 0 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <CheckCircle sx={{ color: '#008A05', fontSize: 40 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {isCreditFlow ? 'Crédits ajoutés !' : 'Paiement confirmé'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {verifyError
            ? verifyError
            : isCreditFlow
              ? 'Votre achat de crédits a été confirmé avec succès.'
              : 'Votre paiement a été confirmé avec succès.'}
        </Typography>

        {isCreditFlow && confirmedBalance !== null && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: brand.primaryAlpha10,
              borderRadius: 3,
              px: 2.5,
              py: 1.25,
              mb: 2.5,
            }}
          >
            <Toll sx={{ fontSize: 22, color: brand.primary }} />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: brand.primary }}
            >
              {confirmedBalance.toLocaleString('fr-FR')} crédits
            </Typography>
          </Box>
        )}

        {onProceedAfterSuccess ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              onClick={onProceedAfterSuccess}
              sx={{
                flex: '0 0 auto',
                borderRadius: 3,
                py: 1.4,
                px: 3,
                fontWeight: 700,
                bgcolor: brand.primary,
                '&:hover': { bgcolor: brand.primaryDark },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Continuer
            </Button>
          </Box>
        ) : null}
      </Box>
    </motion.div>
  );
}
