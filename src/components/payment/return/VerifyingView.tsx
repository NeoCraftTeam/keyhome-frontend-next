'use client';

import { brand } from '@/theme/tokens';
import LockIcon from '@mui/icons-material/Lock';
import { Box, LinearProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

/**
 * Polished, professional payment-verification interstitial.
 *
 * Shown while `usePaymentStatusPolling` is in the `verifying` state. The hook
 * enforces a minimum dwell time (~2.5 s) so even instant Stripe off-session
 * confirmations linger long enough for the user to register what's happening.
 *
 * Visual identity:
 *  - centred KeyHome logo + soft pulsing brand-primary halo,
 *  - rotating sub-title cycling through three reassuring micro-steps
 *    (« passerelle » → « banque » → « solde »), capped at the last one so it
 *    never loops backwards if the polling extends,
 *  - smooth determinate progress bar that fills as the fast-poll attempts
 *    accumulate, with a guaranteed minimum advancement so it never appears
 *    stuck on a slow connection,
 *  - subtle bottom security hint (« Connexion chiffrée · KeyHome ») and a
 *    discreet « Ne fermez pas cette fenêtre… » caption — same vocabulary as
 *    the Stripe and Flutterwave hosted-checkout flows.
 */
interface VerifyingViewProps {
  /** `0..1` progress reported by `usePaymentStatusPolling`. */
  fastPollProgress: number;
  /**
   * Affects the wording of the rotating subtitle. `credit` mentions "votre
   * solde", `unlock` mentions "vos coordonnées d'accès".
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
  fastPollProgress,
  variant,
}: VerifyingViewProps): ReactElement {
  const steps = SUBSTEPS_BY_VARIANT[variant];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (stepIdx >= steps.length - 1) {
      // Pin the last subtitle so the UI never feels like it's regressing
      // when the polling takes longer than the rotation.
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx((idx) => Math.min(idx + 1, steps.length - 1));
    }, SUBSTEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [stepIdx, steps.length]);

  // Mix the polling-based progress with a soft floor so the bar always
  // moves forwards visibly during the first ~2.5 s minimum dwell. Cap at
  // 92% — the final 8% is reserved for the success transition itself.
  const minByTime = Math.min(0.5 + stepIdx * 0.18, 0.92);
  const progressPct = Math.min(
    92,
    Math.max(12, Math.max(fastPollProgress, minByTime) * 100)
  );

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
        {/* Logo with a soft pulsing halo behind it. */}
        <Box
          sx={{
            position: 'relative',
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${brand.primaryAlpha12} 0%, transparent 70%)`,
              animation: 'kh-verify-halo 1.8s ease-in-out infinite',
              '@keyframes kh-verify-halo': {
                '0%, 100%': { opacity: 0.55, transform: 'scale(0.9)' },
                '50%': { opacity: 1, transform: 'scale(1.08)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'relative',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'background.paper',
              boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src="/images/logo.png"
              alt="KeyHome"
              width={36}
              height={36}
              priority
            />
          </Box>
        </Box>

        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ letterSpacing: -0.3, mb: 0.5 }}
          >
            Vérification du paiement
          </Typography>

          {/* Rotating, reassuring subtitle. The keyed Box re-mounts on each
              substep so the fade-in animation re-runs without us having to
              manage CSS transitions manually. */}
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

        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: brand.primaryAlpha10,
              '& .MuiLinearProgress-bar': {
                bgcolor: brand.primary,
                borderRadius: 3,
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              },
            }}
          />
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
            mt: 3,
            color: 'text.disabled',
          }}
        >
          <LockIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            Connexion chiffrée · KeyHome
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
