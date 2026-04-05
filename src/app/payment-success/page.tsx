'use client';

import { paymentsService } from '@/services/payments.service';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HomeIcon from '@mui/icons-material/Home';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { brand, gradient } from '@/theme/tokens';

const MAX_RETRIES = 20;
const INITIAL_RETRY_MS = 800;
const MAX_RETRY_MS = 5000;
// Silent extended polling: if approved but webhook is slow, keep trying every 5s for up to 3 min
const EXTENDED_POLL_MS = 5000;
const EXTENDED_MAX_RETRIES = 36; // 36 × 5s = 3 min

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [finalFailed, setFinalFailed] = useState(false);
  // Extended slow-poll counter (after initial 12 retries)
  const [_extendedRetry, setExtendedRetry] = useState(0);
  const verifiedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adId = searchParams.get('ad_id');
  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');
  const isApproved = status === 'approved';
  const isDeclinedOrCancelled = status === 'declined' || status === 'cancelled';

  const attemptVerify = useCallback(
    async (attempt: number) => {
      if (!adId || !txRef) {
        return;
      }
      try {
        const result = await paymentsService.flutterwaveVerify(txRef);
        if (result.is_unlocked) {
          sessionStorage.setItem('kh_just_unlocked', adId);
          setIsUnlocked(true);
          setVerifying(false);
          return;
        }
      } catch {
        // swallow — will retry
      }

      if (attempt < MAX_RETRIES) {
        setRetryCount(attempt + 1);
        const delay = Math.min(
          INITIAL_RETRY_MS * Math.pow(1.5, attempt),
          MAX_RETRY_MS
        );
        /* eslint-disable react-hooks/immutability */
        retryTimerRef.current = setTimeout(
          () => attemptVerify(attempt + 1),
          delay
        );
        /* eslint-enable react-hooks/immutability */
      } else {
        // Initial retries exhausted — show pending UI and keep polling silently
        setFinalFailed(true);
        setVerifying(false);
      }
    },
    [adId]
  );

  // Silent extended polling: when status=approved but webhook hasn't arrived yet,
  // keep checking every 5s for up to 3 minutes before giving up entirely.
  const extendedPoll = useCallback(
    async (attempt: number) => {
      if (!adId || !txRef) {
        return;
      }
      try {
        const result = await paymentsService.flutterwaveVerify(txRef);
        if (result.is_unlocked) {
          sessionStorage.setItem('kh_just_unlocked', adId);
          setIsUnlocked(true);
          setFinalFailed(false);
          return;
        }
      } catch {
        /* swallow */
      }

      if (attempt < EXTENDED_MAX_RETRIES) {
        setExtendedRetry(attempt + 1);
        /* eslint-disable react-hooks/immutability */
        retryTimerRef.current = setTimeout(
          () => extendedPoll(attempt + 1),
          EXTENDED_POLL_MS
        );
        /* eslint-enable react-hooks/immutability */
      }
      // after EXTENDED_MAX_RETRIES we stop silently — user sees the fallback CTA
    },
    [adId]
  );

  useEffect(() => {
    // Declined or cancelled — skip verification entirely, show terminal UI
    if (isDeclinedOrCancelled) {
      setVerifying(false);
      return;
    }
    if (!adId || !isApproved || verifiedRef.current) {
      setVerifying(false);
      return;
    }
    verifiedRef.current = true;
    attemptVerify(0);
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [adId, txRef, isApproved, isDeclinedOrCancelled, attemptVerify]);

  // Start extended polling once initial retries are done and payment was approved
  useEffect(() => {
    if (!finalFailed || !isApproved || isUnlocked) {
      return;
    }
    extendedPoll(0);
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [finalFailed, isApproved, isUnlocked, extendedPoll]);

  useEffect(() => {
    if (verifying || !isUnlocked) {
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (adId) {
            router.push(`/ads/${adId}`);
          } else {
            router.push('/home');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verifying, isUnlocked, adId, router]);

  if (verifying) {
    const progress = (retryCount / MAX_RETRIES) * 100;
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
            alt="KeyHome — Paiement confirmé"
            width={52}
            height={52}
            style={{ marginBottom: 16 }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Vérification du paiement...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {retryCount === 0
              ? 'Confirmation en cours, merci de patienter.'
              : `Tentative ${retryCount + 1} / ${MAX_RETRIES + 1} — Le paiement est en cours de confirmation.`}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 320 }}>
          <LinearProgress
            variant={retryCount === 0 ? 'indeterminate' : 'determinate'}
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: brand.primary,
                borderRadius: 3,
              },
            }}
          />
        </Box>
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
          maxWidth: 440,
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

        {isApproved && isUnlocked ? (
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
              maintenant accès à toutes les coordonnées de l&apos;annonceur.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                adId ? router.push(`/ads/${adId}`) : router.push('/home')
              }
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
        ) : (
          <>
            {/* ── Declined or Cancelled (terminal failure) ── */}
            {isDeclinedOrCancelled ? (
              <>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor:
                      status === 'cancelled'
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
                        status === 'cancelled'
                          ? 'text.secondary'
                          : 'error.main',
                    }}
                  />
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {status === 'cancelled'
                    ? 'Paiement annulé'
                    : 'Paiement refusé'}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {status === 'cancelled'
                    ? 'Vous avez annulé le paiement. Aucun montant n\u2019a été débité. Vous pouvez réessayer à tout moment.'
                    : 'Le paiement n\u2019a pas abouti. Aucun montant n\u2019a été débité.'}
                </Typography>
                <Box
                  sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}
                >
                  {adId && (
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => router.push(`/ads/${adId}`)}
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
                    onClick={() => router.push('/home')}
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
            ) : (
              /* ── Approved but webhook is slow (not a real error) ── */
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
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Votre paiement a bien été reçu. La confirmation bancaire peut
                  prendre quelques instants supplémentaires.
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Vérification automatique en cours — vous n&apos;avez rien à
                  faire.
                </Typography>

                {/* Silent progress indicator */}
                <Box sx={{ width: '100%', mb: 3 }}>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(246,71,95,0.12)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: brand.primary,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}
                >
                  {adId && (
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => router.push(`/ads/${adId}`)}
                      sx={{
                        py: 1.5,
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
                      Retourner à l&apos;annonce
                    </Button>
                  )}
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
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
