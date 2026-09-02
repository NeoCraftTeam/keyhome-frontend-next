'use client';

import PendingPaymentMessage from '@/components/payment/return/PendingPaymentMessage';
import AppAlert from '@/components/ui/feedback/AppAlert';
import AppLoader from '@/components/ui/feedback/AppLoader';
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import {
  hasPaymentReturnReference,
  isGatewayRedirectCancelled,
  isGatewayRedirectFailed,
  isGatewayRedirectSuccess,
  parsePaymentReturnParams,
} from '@/lib/payment/payment-gateway-return';
import { consumePaymentReturnPath } from '@/lib/payment/payment-return';
import { ownerKeys, paymentKeys, subscriptionKeys } from '@/lib/query-keys';
import { brand } from '@/theme/tokens';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import LoginIcon from '@mui/icons-material/Login';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

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

  const returnParams = useMemo(
    () => parsePaymentReturnParams(searchParams),
    [searchParams]
  );
  const { txRef, gatewayReference, status: gwStatus } = returnParams;

  const skipPolling = useMemo(
    () =>
      !hasPaymentReturnReference(returnParams) ||
      isGatewayRedirectCancelled(gwStatus) ||
      isGatewayRedirectFailed(gwStatus),
    [returnParams, gwStatus]
  );

  const onSuccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    // Refresh the business-domain caches the payment just mutated, so an
    // in-SPA return (Stripe) never shows the previous plan / un-boosted ad.
    if (flow === 'subscription') {
      void queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: subscriptionKeys.current,
      });
    } else {
      void queryClient.invalidateQueries({ queryKey: ownerKeys.ads.all });
    }
  }, [queryClient, flow]);

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
    // No reference at all (gateway stripped the query, retyped URL) —
    // polling never starts, so surface a terminal state instead of an
    // endless "verifying" spinner.
    if (!hasPaymentReturnReference(returnParams)) {
      return 'not_found' as const;
    }
    // Polling still active (`verifying` / `processing`) flows through to the
    // loading view. Only the TERMINAL "polling exhausted but redirect said
    // success" cases (`failed` / `not_found`) become `pending` — never a
    // false "success", since subscription/boost activation is webhook-gated.
    if (
      isGatewayRedirectSuccess(gwStatus) &&
      (state === 'failed' || state === 'not_found')
    ) {
      return 'pending' as const;
    }
    return state;
  }, [state, gwStatus, returnParams]);

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

  if (effectiveState === 'pending') {
    return <PendingPaymentMessage variant={flow} onRetry={retry} />;
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
                background: brand.primary,
                '&:hover': { background: brand.primaryHover },
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
            <AppAlert
              severity="info"
              sx={{ textAlign: 'left', mb: 2.5 }}
              message="Votre session a expiré pendant le paiement. Reconnectez-vous depuis l'espace bailleur pour voir la mise à jour."
            />
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
                background: brand.primary,
                '&:hover': { background: brand.primaryHover },
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
                ? 'Vous avez annulé le paiement. Si un montant a malgré tout été débité, il sera automatiquement pris en compte.'
                : 'Le paiement n\u2019a pas abouti. Si un montant a malgré tout été débité, il sera automatiquement pris en compte.'}
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
                background: brand.primary,
                '&:hover': { background: brand.primaryHover },
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
              {effectiveState === 'not_found'
                ? 'Paiement introuvable'
                : 'Confirmation en cours…'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {effectiveState === 'not_found'
                ? 'Nous n’avons pas retrouvé la référence de ce paiement. Si vous avez validé un paiement, il sera pris en compte automatiquement — consultez votre historique de paiements.'
                : 'Vérification automatique en cours — vous pouvez fermer cette page sans perdre votre paiement.'}
            </Typography>
            {effectiveState === 'processing' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <AppLoader size={40} color={brand.primary} />
              </Box>
            )}
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
