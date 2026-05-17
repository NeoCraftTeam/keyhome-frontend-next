'use client';

import AppLoader from '@/components/ui/AppLoader';
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import { consumePaymentReturnPath } from '@/lib/payment-return';
import { paymentKeys } from '@/lib/query-keys';
import { brand, gradient } from '@/theme/tokens';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import LoginIcon from '@mui/icons-material/Login';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

function isFlutterwaveTerminalFailure(status: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return (
    s === 'declined' || s === 'cancelled' || s === 'failed' || s === 'error'
  );
}

type OwnerReturnFlow = 'subscription' | 'boost';

interface OwnerFlowPaymentReturnViewProps {
  flow: OwnerReturnFlow;
}

/**
 * Post-checkout for bailleur flows (subscription / boost) after hosted checkout.
 */
export default function OwnerFlowPaymentReturnView({
  flow,
}: OwnerFlowPaymentReturnViewProps): ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const txRef = searchParams.get('tx_ref');
  const gwStatus = searchParams.get('status');

  const skipPolling = useMemo(
    () => !txRef || isFlutterwaveTerminalFailure(gwStatus),
    [txRef, gwStatus]
  );

  const onSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  }, [queryClient]);

  const { state, retry } = usePaymentStatusPolling({
    txRef,
    variant: 'unlock',
    skip: skipPolling,
    onSuccess,
  });

  const effectiveState = useMemo(() => {
    if (isFlutterwaveTerminalFailure(gwStatus)) {
      return gwStatus?.toLowerCase() === 'cancelled'
        ? ('cancelled' as const)
        : ('failed' as const);
    }
    return state;
  }, [state, gwStatus]);

  const continuePath =
    flow === 'subscription' ? '/owner/subscriptions' : '/owner/ads';
  const titleOk =
    flow === 'subscription' ? 'Abonnement mis à jour' : 'Paiement enregistré';
  const bodyOk =
    flow === 'subscription'
      ? 'Votre paiement a été confirmé. Votre espace bailleur reflètera les changements sous peu.'
      : 'Votre paiement a été confirmé. Vos annonces seront mises à jour sous peu.';

  if (effectiveState === 'verifying') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 3,
          p: 3,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Image
            src="/images/logo.png"
            alt="KeyHome"
            width={52}
            height={52}
            style={{ marginBottom: 16 }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Vérification du paiement...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Confirmation auprès de la passerelle, merci de patienter.
          </Typography>
        </Box>
        <AppLoader size={48} color={brand.primary} />
      </Box>
    );
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
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {titleOk}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {bodyOk}
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                router.push(consumePaymentReturnPath(continuePath))
              }
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: gradient.primary,
                '&:hover': { background: gradient.primaryHover },
              }}
            >
              Continuer
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
              Votre session a expiré pendant le paiement. Reconnectez-vous
              depuis l&apos;espace bailleur pour voir la mise à jour.
            </Alert>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LoginIcon />}
              onClick={() =>
                router.push(
                  `/owner/login?return=${encodeURIComponent(continuePath)}`
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
                ? 'Vous avez annulé le paiement. Aucun montant n\u2019a été débité.'
                : 'Le paiement n\u2019a pas abouti. Aucun montant n\u2019a été débité.'}
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                router.push(consumePaymentReturnPath(continuePath))
              }
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: gradient.primary,
                '&:hover': { background: gradient.primaryHover },
              }}
            >
              Retour
            </Button>
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
              }}
            >
              <HourglassIcon sx={{ fontSize: 44, color: brand.primary }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Confirmation en cours…
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Vérification automatique en cours — vous pouvez fermer cette page
              sans perdre votre paiement.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <AppLoader size={40} color={brand.primary} />
            </Box>
            <Button variant="outlined" fullWidth onClick={retry} sx={{ mb: 1 }}>
              Vérifier maintenant
            </Button>
            <Button
              variant="text"
              fullWidth
              startIcon={<HomeIcon />}
              onClick={() =>
                router.push(consumePaymentReturnPath(continuePath))
              }
            >
              Retour espace bailleur
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
