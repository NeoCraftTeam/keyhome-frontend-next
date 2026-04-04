'use client';

import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { usePayment } from '@/hooks/usePayment';
import {
  FlutterwaveInitiatePayload,
  PaymentMethod,
  PaymentType,
} from '@/types';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Close from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import Lock from '@mui/icons-material/Lock';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { brand } from '@/theme/tokens';

type Step = 'select-method' | 'enter-phone' | 'loading' | 'done';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Payment context */
  amount: number;
  type: PaymentType;
  adId?: string | null;
  agencyId?: string | null;
  planId?: string | null;
  period?: 'monthly' | 'yearly' | null;
  /** Optional label shown in the header (e.g. property title) */
  label?: string;
  /** Called when the payment was confirmed successful */
  onSuccess?: () => void;
}

/** Cameroon phone number: must start with 6, 7 or 2, 9 digits total */
const PHONE_REGEX = /^(6|7|2)\d{8}$/;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount);
}

function methodRequiresPhone(method: PaymentMethod | null): boolean {
  return (
    method === PaymentMethod.MOBILE_MONEY ||
    method === PaymentMethod.ORANGE_MONEY
  );
}

export default function PaymentModal({
  open,
  onClose,
  amount,
  type,
  adId = null,
  agencyId = null,
  planId = null,
  period = null,
  label,
  onSuccess: _onSuccess,
}: PaymentModalProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState<Step>('select-method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  const { initiatePayment, isLoading, error, resetPayment } = usePayment();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('select-method');
      setSelectedMethod(null);
      setPhone('');
      setPhoneError('');
      resetPayment();
    }
  }, [open, resetPayment]);

  const handleClose = useCallback(() => {
    if (step === 'loading') {
      return;
    } // Block close during loading
    onClose();
  }, [step, onClose]);

  const handleSubmit = useCallback(
    async (method: PaymentMethod, phoneNumber: string | null) => {
      setStep('loading');

      const payload: FlutterwaveInitiatePayload = {
        type: type as FlutterwaveInitiatePayload['type'],
        payment_method: method as FlutterwaveInitiatePayload['payment_method'],
        ...(phoneNumber && { phone_number: `+237${phoneNumber}` }),
        ...(adId && { ad_id: adId }),
        ...(agencyId && { agency_id: agencyId }),
        ...(planId && { plan_id: planId }),
        ...(period && { period }),
      };

      await initiatePayment(payload);
      // initiatePayment redirects to Flutterwave hosted checkout on success
      // If it returns (errors), transition to done state to show error
      setStep('done');
    },
    [type, adId, agencyId, planId, period, initiatePayment]
  );

  const handleMethodConfirm = useCallback(() => {
    if (!selectedMethod) {
      return;
    }
    if (methodRequiresPhone(selectedMethod)) {
      setStep('enter-phone');
    } else {
      handleSubmit(selectedMethod, null);
    }
  }, [selectedMethod, handleSubmit]);

  const handlePhoneConfirm = useCallback(() => {
    const cleaned = phone.trim();
    if (!PHONE_REGEX.test(cleaned)) {
      setPhoneError('Numéro invalide. Format attendu : 6xxxxxxxx (9 chiffres)');
      return;
    }
    setPhoneError('');
    handleSubmit(selectedMethod!, cleaned);
  }, [phone, selectedMethod, handleSubmit]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 5,
          overflow: 'hidden',
          background: 'transparent',
          boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.28)',
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 4,
          pb: 3,
          background:
            'linear-gradient(135deg, #0A1628 0%, #1a2540 50%, #0D1F3C 100%)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(246,71,95,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            right: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {step !== 'loading' && (
          <IconButton
            aria-label="Fermer"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'rgba(255,255,255,0.5)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}

        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'rgba(246,71,95,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <Lock sx={{ color: brand.primary, fontSize: 26 }} />
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: '#fff', letterSpacing: -0.5, lineHeight: 1.2, mb: 0.5 }}
        >
          {label ?? 'Paiement sécurisé'}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={900}
          sx={{ color: brand.primary, letterSpacing: -1 }}
        >
          {formatAmount(amount)}
        </Typography>
      </Box>

      {/* ── BODY ── */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, bgcolor: 'background.paper' }}>
        {step === 'select-method' && (
          <>
            <Typography
              variant="overline"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary',
                letterSpacing: 1.5,
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              Choisir un mode de paiement
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <PaymentMethodSelector
                selected={selectedMethod}
                onChange={setSelectedMethod}
              />
            </Box>
            <Button
              fullWidth
              variant="contained"
              disabled={!selectedMethod || isLoading}
              onClick={handleMethodConfirm}
              sx={{
                mt: 3,
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
          </>
        )}

        {step === 'enter-phone' && (
          <>
            <Typography
              variant="overline"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary',
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
              helperText={phoneError || ' '}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePhoneConfirm();
                }
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
          </>
        )}

        {step === 'loading' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ color: brand.primary, mb: 2 }} size={48} />
            <Typography variant="body1" fontWeight={600}>
              Redirection en cours...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vous allez être redirigé vers la page de paiement sécurisé.
            </Typography>
          </Box>
        )}

        {step === 'done' && error && (
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
              {error}
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                resetPayment();
                setStep('select-method');
              }}
              sx={{ borderRadius: 3, py: 1.4, fontWeight: 600 }}
            >
              Réessayer
            </Button>
          </Box>
        )}

        {step === 'done' && !error && (
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
              Paiement initié avec succès
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vous avez été redirigé vers la page de paiement.
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── FOOTER ── */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          bgcolor: isDark ? '#0A0F1E' : 'background.default',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Flutterwave"
            width={16}
            height={16}
          />
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.3)' : 'text.disabled',
              fontSize: '0.7rem',
            }}
          >
            Paiement sécurisé via Flutterwave
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
