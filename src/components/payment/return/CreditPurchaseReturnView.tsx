'use client';

import VerifyingView from '@/components/payment/return/VerifyingView';
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import { consumePaymentReturnPath } from '@/lib/payment-return';
import { creditsKeys } from '@/lib/query-keys';
import { brand, gradient } from '@/theme/tokens';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import LoginIcon from '@mui/icons-material/Login';
import Toll from '@mui/icons-material/Toll';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

function isFlutterwaveRedirectCancelled(status: string | null): boolean {
  if (!status) {
    return false;
  }
  return status.toLowerCase() === 'cancelled';
}

function isFlutterwaveRedirectFailed(status: string | null): boolean {
  if (!status) {
    return false;
  }
  const s = status.toLowerCase();
  return s === 'declined' || s === 'failed' || s === 'error';
}

/**
 * Post-checkout UI for credit purchases (Flutterwave redirect + Stripe return URL).
 * Rendered on `/credits/callback` (legacy) and `/payment/return?flow=credit`.
 */
export default function CreditPurchaseReturnView(): ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const adId = searchParams.get('ad_id');
  const status = searchParams.get('status');
  const txRef = searchParams.get('tx_ref');

  const skipPolling = useMemo(() => {
    if (isFlutterwaveRedirectCancelled(status)) return true;
    if (isFlutterwaveRedirectFailed(status)) return true;
    return false;
  }, [status]);

  const onSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: creditsKeys.balance });
    void queryClient.invalidateQueries({ queryKey: creditsKeys.all });
  }, [queryClient]);

  const { state, pointBalance, retry } = usePaymentStatusPolling({
    txRef,
    variant: 'credit',
    skip: skipPolling,
    onSuccess,
  });

  const effectiveState = useMemo(() => {
    if (isFlutterwaveRedirectCancelled(status)) return 'cancelled' as const;
    if (isFlutterwaveRedirectFailed(status)) return 'failed' as const;
    return state;
  }, [state, status]);

  const fallbackPath = adId ? `/ads/${adId}` : '/home';

  useEffect(() => {
    /* reserved for future telemetry */
  }, [effectiveState]);

  if (effectiveState === 'verifying') {
    return <VerifyingView variant="credit" />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
        </Box>

        {effectiveState === 'success' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(0, 138, 5, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: 'scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                '@keyframes scaleIn': {
                  '0%': { transform: 'scale(0)', opacity: 0 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Crédits ajoutés !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Votre achat de crédits a été confirmé avec succès.
            </Typography>

            {pointBalance !== null && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(246, 71, 95, 0.08)',
                  borderRadius: 3,
                  px: 2.5,
                  py: 1.25,
                  mb: 3,
                }}
              >
                <Toll sx={{ fontSize: 22, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {pointBalance.toLocaleString('fr-FR')} crédits
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                router.push(consumePaymentReturnPath(fallbackPath))
              }
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: gradient.primary,
                '&:hover': { background: gradient.primaryHover },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              {adId ? "Déverrouiller l'annonce" : 'Continuer'}
            </Button>
          </>
        )}

        {effectiveState === 'auth_lost' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(0, 138, 5, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Paiement confirmé
            </Typography>
            <Alert
              severity="info"
              sx={{ textAlign: 'left', mb: 2.5, borderRadius: 2 }}
            >
              Votre session a expiré pendant le paiement. Vos crédits ont bien
              été ajoutés à votre compte par notre système — reconnectez-vous
              pour les voir et continuer.
            </Alert>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<LoginIcon />}
                onClick={() =>
                  router.push(
                    `/login?return=${encodeURIComponent(fallbackPath)}`
                  )
                }
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  background: gradient.primary,
                  '&:hover': { background: gradient.primaryHover },
                }}
              >
                Se reconnecter
              </Button>
              <Button
                variant="text"
                size="medium"
                fullWidth
                startIcon={<HomeIcon />}
                onClick={() => router.push('/home')}
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                Accueil
              </Button>
            </Box>
          </>
        )}

        {(effectiveState === 'failed' || effectiveState === 'cancelled') && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor:
                  effectiveState === 'cancelled'
                    ? 'rgba(100,100,100,0.1)'
                    : 'rgba(193,53,21,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 48,
                  color:
                    effectiveState === 'cancelled'
                      ? 'text.secondary'
                      : 'error.main',
                }}
              />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {effectiveState === 'cancelled'
                ? 'Paiement annulé'
                : 'Paiement échoué'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {effectiveState === 'cancelled'
                ? 'Vous avez annulé le paiement. Aucun montant n\u2019a été débité. Vous pouvez réessayer à tout moment.'
                : "Le paiement n'a pas abouti. Aucun montant n'a été débité de votre compte."}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() =>
                  router.push(consumePaymentReturnPath(fallbackPath))
                }
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  background: gradient.primary,
                  '&:hover': { background: gradient.primaryHover },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {adId
                  ? "Retourner à l'annonce"
                  : effectiveState === 'cancelled'
                    ? 'Continuer'
                    : 'Réessayer'}
              </Button>
              {adId && (
                <Button
                  variant="text"
                  size="medium"
                  fullWidth
                  startIcon={<HomeIcon />}
                  onClick={() => router.push(consumePaymentReturnPath('/home'))}
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                >
                  Accueil
                </Button>
              )}
            </Box>
          </>
        )}

        {(effectiveState === 'processing' ||
          effectiveState === 'not_found') && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: brand.primaryAlpha10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.06)', opacity: 0.85 },
                },
              }}
            >
              <HourglassIcon sx={{ fontSize: 44, color: brand.primary }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Confirmation en cours…
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {effectiveState === 'not_found'
                ? "Nous n'avons pas encore trouvé votre paiement. Cela peut prendre un instant."
                : 'Votre paiement a bien été reçu. La confirmation bancaire peut prendre quelques instants supplémentaires.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Vérification automatique en cours — vous pouvez fermer cette page
              sans perdre votre paiement.
            </Typography>

            <Box sx={{ width: '100%', mb: 3 }}>
              <LinearProgress
                variant="indeterminate"
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: brand.primaryAlpha12,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: brand.primary,
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box
              sx={{ display: 'flex', gap: 1.5, flexDirection: 'column', mt: 1 }}
            >
              <Button
                variant="outlined"
                size="medium"
                fullWidth
                onClick={retry}
                sx={{
                  py: 1.2,
                  fontWeight: 600,
                  borderColor: brand.primary,
                  color: brand.primary,
                  '&:hover': {
                    borderColor: brand.primaryDark,
                    color: brand.primaryDark,
                    bgcolor: brand.primaryAlpha5,
                  },
                }}
              >
                Vérifier maintenant
              </Button>
              {adId && (
                <Button
                  variant="text"
                  size="medium"
                  fullWidth
                  onClick={() =>
                    router.push(consumePaymentReturnPath(`/ads/${adId}`))
                  }
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                >
                  Retourner à l&apos;annonce
                </Button>
              )}
              <Button
                variant="text"
                size="medium"
                fullWidth
                startIcon={<HomeIcon />}
                onClick={() => router.push(consumePaymentReturnPath('/home'))}
                sx={{ fontWeight: 600, color: 'text.secondary' }}
              >
                Accueil
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
