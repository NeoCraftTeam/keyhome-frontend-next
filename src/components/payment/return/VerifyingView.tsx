'use client';

import AppLoader from '@/components/ui/AppLoader';
import { DEFAULT_MINIMUM_VERIFYING_MS } from '@/hooks/usePaymentStatusPolling';
import LockIcon from '@mui/icons-material/Lock';
import { Box, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

/**
 * Payment verification interstitial while `usePaymentStatusPolling` is in
 * `verifying`. Spinner matches the dashboard gate (`layout.tsx`): `AppLoader`
 * brand bars. Terminal transitions remain gated by the hook's
 * `minimumVerifyingMs` (default {@link DEFAULT_MINIMUM_VERIFYING_MS}).
 *
 * Rotating reassurance subtitles (« passerelle » → « banque » → outcome prep)
 * cap at the last line so extended polling never loops backwards.
 */
interface VerifyingViewProps {
  /**
   * Mirrors `minimumVerifyingMs` on `usePaymentStatusPolling`; the hook
   * applies the dwell — this stays for API symmetry and callers that forward
   * the same constant.
   */
  minimumVerifyingMs?: number;
  /**
   * Wording nuance for the rotating subtitle (`credit`: solde, `unlock`: accès).
   */
  variant: 'credit' | 'unlock';
}

const SUBSTEPS_BY_VARIANT: Record<VerifyingViewProps['variant'], string[]> = {
  credit: [
    'Connexion sécurisée à la passerelle de paiement…',
    'Confirmation auprès de votre banque…',
    'Mise à jour de votre solde de crédits…',
  ],
  unlock: [
    'Connexion sécurisée à la passerelle de paiement…',
    'Confirmation auprès de votre banque…',
    'Préparation de vos coordonnées d’accès…',
  ],
};

const SUBSTEP_INTERVAL_MS = 1100;

export default function VerifyingView({
  minimumVerifyingMs = DEFAULT_MINIMUM_VERIFYING_MS,
  variant,
}: VerifyingViewProps): ReactElement {
  const steps = SUBSTEPS_BY_VARIANT[variant];
  const [stepIdx, setStepIdx] = useState(0);

  // Ensures JSX callers can mirror `minimumVerifyingMs`; dwell is enforced in the hook only.
  void minimumVerifyingMs;

  useEffect(() => {
    if (stepIdx >= steps.length - 1) {
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx((idx) => Math.min(idx + 1, steps.length - 1));
    }, SUBSTEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [stepIdx, steps.length]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
          <AppLoader size={64} />
        </Box>

        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ letterSpacing: -0.3, mb: 0.5 }}
          >
            Vérification du paiement
          </Typography>

          <Box
            key={stepIdx}
            sx={{
              minHeight: 22,
              animation: 'kh-verify-fade 0.45s ease-out',
              '@keyframes kh-verify-fade': {
                from: { opacity: 0, transform: 'translateY(4px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {steps[stepIdx]}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 0.5 }}
        >
          Ne fermez pas cette fenêtre — quelques secondes suffisent.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mt: 2,
            color: 'text.disabled',
          }}
        >
          <LockIcon sx={{ fontSize: 14 }} aria-hidden />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Connexion chiffrée · KeyHome
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
