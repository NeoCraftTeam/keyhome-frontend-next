'use client';

import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import StripeConfirmStep from '@/components/payment/StripeConfirmStep';
import { usePayment } from '@/hooks/usePayment';
import { useAuth } from '@/providers/AuthProvider';
import { paymentsService } from '@/services/payments.service';
import { brand } from '@/theme/tokens';
import {
  FlutterwaveInitiatePayload,
  PaymentMethod,
  PaymentMethodInfo,
  PaymentType,
} from '@/types';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
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
  | 'enter-phone'
  | 'loading'
  | 'stripe-confirm'
  | 'verifying'
  | 'done-success'
  | 'done-redirect'
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
   * Called when the user successfully completed the payment :
   *  - mobile money : the redirect to Flutterwave hosted checkout has been
   *    *initiated* (the user will leave the page imminently)
   *  - card : Stripe `confirmPayment` resolved with `succeeded`
   * Either way, the parent should refresh balance / unlocked state.
   */
  onSuccess?: () => void;
  /**
   * Called when the user clicks the back/cancel control on the FIRST step
   * (select-method). When omitted, the back button is hidden — useful when
   * the parent dialog already provides its own close affordance.
   */
  onBack?: () => void;
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
  onBack,
}: PaymentFlowProps): React.ReactElement {
  const { user } = useAuth();
  const profilePhone = extractCamPhoneDigits(user?.phone_number);

  const [step, setStep] = useState<Step>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethodInfo[] | null
  >(null);
  // Captured from the initiate response. Powers verify / cancel calls
  // and survives the Stripe Elements step. `null` until we have a live
  // server-side Payment row.
  const [txRef, setTxRef] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const {
    initiatePayment,
    isLoading,
    error,
    resetPayment,
    stripeClientSecret,
  } = usePayment();

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
    async (method: PaymentMethod, phoneNumber: string | null) => {
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
      };

      const result = await initiatePayment(payload);

      if (!result) {
        // Initiation failed — the hook populated `error` ; surface it.
        setStep('done-error');
        return;
      }

      setTxRef(result.tx_ref);

      if (result.gateway === 'stripe') {
        // Branch SYNCHRONOUSLY on the returned gateway. No effect-after-
        // commit dance — mounts <Elements> on the next render with the
        // clientSecret already populated by the hook.
        setStep('stripe-confirm');
        return;
      }

      // Flutterwave : the hook fired the redirect already. Show a brief
      // "redirection" placeholder — the page is leaving in the next tick.
      setStep('done-redirect');
    },
    [type, adId, agencyId, planId, period, initiatePayment]
  );

  const handleMethodConfirm = useCallback(() => {
    if (!selectedMethod) return;
    if (methodRequiresPhone(selectedMethod)) {
      // Pre-fill with the profile phone when available and the field is still empty.
      if (profilePhone && !phone) {
        setPhone(profilePhone);
      }
      setStep('enter-phone');
    } else {
      // For mobile money: forward the profile phone (if available) so that
      // Flutterwave can pre-fill the phone field on its hosted checkout.
      // submit() will prepend +237 before sending to the backend.
      const phoneArg =
        selectedMethod === PaymentMethod.MOBILE_MONEY
          ? profilePhone || null
          : null;
      submit(selectedMethod, phoneArg);
    }
  }, [selectedMethod, submit, profilePhone, phone]);

  const handlePhoneConfirm = useCallback(() => {
    const cleaned = phone.trim();
    if (!PHONE_REGEX.test(cleaned)) {
      setPhoneError('Numéro invalide. Format attendu : 6xxxxxxxx (9 chiffres)');
      return;
    }
    setPhoneError('');
    submit(selectedMethod!, cleaned);
  }, [phone, selectedMethod, submit]);

  // After Stripe.confirmPayment succeeds, ask our backend to verify with
  // Stripe and grant credits / unlock idempotently. This fast-tracks the
  // post-payment UI without waiting for the asynchronous webhook — even if
  // the webhook lands first, the verify call is a no-op (PaymentObserver
  // protects against double-credit via row locks).
  const handleStripeSuccess = useCallback(async () => {
    if (!txRef) {
      // Defensive : should never happen since txRef is set in submit().
      onSuccess?.();
      setStep('done-success');
      return;
    }

    setStep('verifying');
    try {
      const verifyResult = await paymentsService.verify(txRef);
      if (verifyResult.is_paid) {
        onSuccess?.();
        setStep('done-success');
      } else {
        // Stripe accepted the card but the webhook hasn't propagated yet.
        // We still call onSuccess (the parent should refresh balance ;
        // the eventual webhook will reconcile) and show success — the
        // user paid, the credits will arrive in seconds.
        onSuccess?.();
        setStep('done-success');
      }
    } catch {
      // Verify failed (network / 5xx). The webhook will still reconcile
      // server-side, so we treat this as success but warn the user.
      setVerifyError(
        "Le paiement a été accepté mais nous n'avons pas pu confirmer la mise à jour. Vos crédits seront ajoutés sous peu."
      );
      onSuccess?.();
      setStep('done-success');
    }
  }, [txRef, onSuccess]);

  const handleStripeCancel = useCallback(() => {
    if (txRef) {
      // Fire-and-forget : the user is going back to method selection,
      // there's no point blocking the UI on the cancel call.
      paymentsService.cancel(txRef).catch(() => undefined);
    }
    resetPayment();
    setTxRef(null);
    setStep('select-method');
  }, [txRef, resetPayment]);

  // ─── render ────────────────────────────────────────────────────────────

  if (step === 'select-method') {
    return (
      <motion.div key="select-method" {...STEP_MOTION}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
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
              onClick={() => setStep('select-method')}
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

  if (step === 'stripe-confirm' && stripeClientSecret) {
    return (
      <motion.div key="stripe-confirm" {...STEP_MOTION}>
        <StripeConfirmStep
          clientSecret={stripeClientSecret}
          onSuccess={handleStripeSuccess}
          onBack={handleStripeCancel}
        />
      </motion.div>
    );
  }

  if (step === 'verifying') {
    return (
      <motion.div key="verifying" {...STEP_MOTION}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ color: brand.primary, mb: 2 }} size={48} />
          <Typography variant="body1" fontWeight={600}>
            Vérification du paiement…
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Confirmation auprès de Stripe et mise à jour de votre solde.
          </Typography>
        </Box>
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
              setStep('select-method');
            }}
            sx={{ borderRadius: 3, py: 1.4, fontWeight: 600 }}
          >
            Réessayer
          </Button>
        </Box>
      </motion.div>
    );
  }

  if (step === 'done-redirect') {
    return (
      <motion.div key="done-redirect" {...STEP_MOTION}>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress sx={{ color: brand.primary, mb: 2 }} size={48} />
          <Typography variant="body1" fontWeight={700} gutterBottom>
            Redirection en cours…
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vous êtes redirigé vers la page de paiement sécurisée.
          </Typography>
        </Box>
      </motion.div>
    );
  }

  // step === 'done-success' — Stripe payment confirmed in-page.
  return (
    <motion.div key="done-success" {...STEP_MOTION}>
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'rgba(0,138,5,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CheckCircle sx={{ color: '#008A05', fontSize: 32 }} />
        </Box>
        <Typography variant="body1" fontWeight={700} gutterBottom>
          Paiement confirmé
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: verifyError ? 2 : 0 }}
        >
          {verifyError
            ? verifyError
            : 'Votre solde a été crédité. Merci pour votre confiance.'}
        </Typography>
      </Box>
    </motion.div>
  );
}
