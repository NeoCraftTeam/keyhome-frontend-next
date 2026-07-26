'use client';

import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, Paper, Typography } from '@mui/material';
import type { ReactElement } from 'react';

/**
 * "Paid but not yet confirmed" terminal state.
 *
 * Used when the hosted-checkout redirect reports success but our server-side
 * `verify` never confirmed within the polling window — typically a delayed
 * webhook. We deliberately avoid claiming "success" (credits/access aren't
 * granted until the webhook lands) and avoid a misleading "failed" (the
 * payment most likely went through). The honest message is "received,
 * confirmation in progress" with an explicit retry affordance.
 */
interface PendingPaymentMessageProps {
  variant: 'credit' | 'unlock' | 'subscription' | 'boost';
  onRetry?: () => void;
  retryLabel?: string;
}

const COPY_BY_VARIANT: Record<
  PendingPaymentMessageProps['variant'],
  { headline: string; outcome: string }
> = {
  credit: {
    headline: 'Paiement reçu — confirmation en cours',
    outcome:
      'Vos crédits seront ajoutés à votre solde dès la confirmation, généralement sous quelques minutes.',
  },
  unlock: {
    headline: 'Paiement reçu — confirmation en cours',
    outcome:
      'L’accès à l’annonce sera débloqué dès la confirmation, généralement sous quelques minutes.',
  },
  subscription: {
    headline: 'Paiement reçu — confirmation en cours',
    outcome:
      'Votre abonnement sera activé dès la confirmation, généralement sous quelques minutes.',
  },
  boost: {
    headline: 'Paiement reçu — confirmation en cours',
    outcome:
      'Le boost sera appliqué à votre annonce dès la confirmation, généralement sous quelques minutes.',
  },
};

export default function PendingPaymentMessage({
  variant,
  onRetry,
  retryLabel = 'Vérifier à nouveau',
}: PendingPaymentMessageProps): ReactElement {
  const copy = COPY_BY_VARIANT[variant];

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
          width: '100%',
          maxWidth: 460,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'warning.light',
            color: 'warning.dark',
            mb: 2,
          }}
        >
          <HourglassTopIcon sx={{ fontSize: 36 }} aria-hidden />
        </Box>

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ letterSpacing: -0.3, mb: 1 }}
        >
          {copy.headline}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {copy.outcome}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 2 }}
        >
          Vous recevrez un e-mail de confirmation. Vous pouvez fermer cette page
          en toute sécurité — la confirmation se fait en arrière-plan.
        </Typography>

        {onRetry && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ minHeight: 44, textTransform: 'none' }}
          >
            {retryLabel}
          </Button>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            mt: 3,
            color: 'text.disabled',
          }}
        >
          <LockIcon sx={{ fontSize: 14 }} aria-hidden />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Connexion chiffrée · KeyHome
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
