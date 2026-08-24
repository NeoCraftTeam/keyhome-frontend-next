'use client';

import PendingPaymentMessage from '@/components/payment/return/PendingPaymentMessage';
import VerifyingView from '@/components/payment/return/VerifyingView';
import AppAlert from '@/components/ui/feedback/AppAlert';
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import {
  hasPaymentReturnReference,
  isGatewayRedirectCancelled,
  isGatewayRedirectFailed,
  isGatewayRedirectSuccess,
  parsePaymentReturnParams,
} from '@/lib/payment/payment-gateway-return';
import { consumePaymentReturnPath } from '@/lib/payment/payment-return';
import { creditsKeys, paymentKeys } from '@/lib/query-keys';
import { brand, gradient } from '@/theme/tokens';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import LoginIcon from '@mui/icons-material/Login';
import { Box, Button, LinearProgress, Paper, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Post-checkout UI for ad unlock payments.
 * Rendered on `/payment-success` (legacy) and `/payment/return?flow=unlock`.
 */
export default function UnlockPaymentReturnView(): ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);

  const adId = searchParams.get('ad_id');
  const returnParams = useMemo(
    () => parsePaymentReturnParams(searchParams),
    [searchParams]
  );
  const { txRef, gatewayReference, status: gwStatus } = returnParams;

  const skipPolling = useMemo(
    () =>
      !adId ||
      !hasPaymentReturnReference(returnParams) ||
      isGatewayRedirectCancelled(gwStatus) ||
      isGatewayRedirectFailed(gwStatus),
    [adId, returnParams, gwStatus]
  );

  const onSuccess = useCallback(() => {
    if (adId) {
      sessionStorage.setItem('kh_just_unlocked', adId);
    }
    void queryClient.invalidateQueries({ queryKey: creditsKeys.balance });
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  }, [adId, queryClient]);

  const { state, retry } = usePaymentStatusPolling({
    txRef,
    gatewayReference,
    gatewayRedirectStatus: gwStatus,
    variant: 'unlock',
    skip: skipPolling,
    onSuccess,
  });

  const effectiveState = useMemo(() => {
    if (isGatewayRedirectCancelled(gwStatus)) {
      return 'cancelled' as const;
    }
    if (isGatewayRedirectFailed(gwStatus)) {
      return 'failed' as const;
    }
    // No usable reference / ad id — polling never starts, so surface a
    // terminal state instead of an endless "verifying" spinner.
    if (!adId || !hasPaymentReturnReference(returnParams)) {
      return 'not_found' as const;
    }
    // Polling still active (`verifying` / `processing`) flows through to the
    // loading view. Only the TERMINAL "polling exhausted but redirect said
    // success" cases (`failed` / `not_found`) become `pending` — never a
    // false "success", since unlock is webhook-gated.
    if (
      isGatewayRedirectSuccess(gwStatus) &&
      (state === 'failed' || state === 'not_found')
    ) {
      return 'pending' as const;
    }
    return state;
  }, [state, gwStatus, adId, returnParams]);

  useEffect(() => {
    if (effectiveState !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const fallback = adId ? `/ads/${adId}` : '/home';
          if (adId) {
            sessionStorage.setItem('kh_just_unlocked', adId);
          }
          router.push(consumePaymentReturnPath(fallback));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [effectiveState, adId, router]);

  const fallbackPath = adId ? `/ads/${adId}` : '/home';

  if (effectiveState === 'verifying') {
    return <VerifyingView variant="unlock" />;
  }

  if (effectiveState === 'pending') {
    return <PendingPaymentMessage variant="unlock" onRetry={retry} />;
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
          <Image
            src="/images/logo.png"
            alt="KeyHome — Paiement confirmé"
            width={48}
            height={48}
          />
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
              Paiement réussi !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              L&apos;annonce a été déverrouillée avec succès. Vous avez
              maintenant accès aux coordonnées de l&apos;annonceur.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => {
                if (adId) sessionStorage.setItem('kh_just_unlocked', adId);
                router.push(consumePaymentReturnPath(fallbackPath));
              }}
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: gradient.primary,
                '&:hover': { background: gradient.primaryHover },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              Voir l&apos;annonce
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
            <AppAlert
              severity="info"
              sx={{ textAlign: 'left', mb: 2.5 }}
              message="Votre session a expiré pendant le paiement. Reconnectez-vous pour accéder à l'annonce déverrouillée."
            />
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
                : 'Paiement refusé'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {effectiveState === 'cancelled'
                ? 'Vous avez annulé le paiement. Si un montant a malgré tout été débité, il sera automatiquement pris en compte.'
                : 'Le paiement n\u2019a pas abouti. Si un montant a malgré tout été débité, il sera automatiquement pris en compte.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
              {adId && (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() =>
                    router.push(consumePaymentReturnPath(`/ads/${adId}`))
                  }
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background: gradient.primary,
                    '&:hover': { background: gradient.primaryHover },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  Retourner à l&apos;annonce
                </Button>
              )}
              <Button
                variant={adId ? 'text' : 'contained'}
                size="large"
                fullWidth
                startIcon={!adId ? undefined : <HomeIcon />}
                onClick={() => router.push(consumePaymentReturnPath('/home'))}
                sx={
                  adId
                    ? { fontWeight: 600, color: 'text.secondary' }
                    : {
                        py: 1.5,
                        fontWeight: 600,
                        background: gradient.primary,
                        '&:hover': { background: gradient.primaryHover },
                        '&:active': { transform: 'scale(0.97)' },
                      }
                }
              >
                {adId ? 'Accueil' : 'Retour à l\u2019accueil'}
              </Button>
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
              {effectiveState === 'not_found'
                ? 'Paiement introuvable'
                : 'Confirmation en cours…'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {effectiveState === 'not_found'
                ? 'Nous n’avons pas retrouvé la référence de ce paiement. Si vous avez validé un paiement, il sera pris en compte automatiquement — consultez votre historique de paiements.'
                : 'Votre paiement a bien été reçu. La confirmation bancaire peut prendre quelques instants supplémentaires.'}
            </Typography>
            {effectiveState === 'processing' && (
              <>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vérification automatique en cours — vous pouvez fermer cette
                  page sans perdre votre paiement.
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
              </>
            )}
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
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
