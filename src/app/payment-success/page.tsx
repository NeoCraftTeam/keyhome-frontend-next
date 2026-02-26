'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { paymentsService } from '@/services/payments.service';

const MAX_RETRIES = 12;
const INITIAL_RETRY_MS = 800;
const MAX_RETRY_MS = 3000;

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [finalFailed, setFinalFailed] = useState(false);
  const verifiedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adId = searchParams.get('ad_id');
  const status = searchParams.get('status');
  const isApproved = status === 'approved';

  const attemptVerify = useCallback(async (attempt: number) => {
    if (!adId) { return; }
    try {
      const result = await paymentsService.verify(adId);
      if (result.is_unlocked) {
        // Mark in sessionStorage so the ad page knows to refetch (no URL param needed)
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
      // Progressive delay: starts fast, caps at MAX_RETRY_MS
      const delay = Math.min(INITIAL_RETRY_MS * Math.pow(1.5, attempt), MAX_RETRY_MS);
      retryTimerRef.current = setTimeout(() => attemptVerify(attempt + 1), delay);
    } else {
      setFinalFailed(true);
      setVerifying(false);
    }
  }, [adId]);

  useEffect(() => {
    if (!adId || !isApproved || verifiedRef.current) {
      setVerifying(false);
      return;
    }
    verifiedRef.current = true;
    attemptVerify(0);

    return () => {
      if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); }
    };
  }, [adId, isApproved, attemptVerify]);

  useEffect(() => {
    if (verifying || !isUnlocked) { return; }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (adId) {
            router.push(`/ads/${adId}/annonce`);
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, p: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Image src="/images/logo.png" alt="KeyHome — Paiement confirmé" width={52} height={52} style={{ marginBottom: 16 }} />
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
              '& .MuiLinearProgress-bar': { bgcolor: '#F6475F', borderRadius: 3 },
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
          <Image src="/images/logo.png" alt="KeyHome — Paiement confirmé" width={48} height={48} />
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
              L&apos;annonce a été déverrouillée avec succès.
              Vous avez maintenant accès à toutes les coordonnées de l&apos;annonceur.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() =>
                adId ? router.push(`/ads/${adId}/annonce`) : router.push('/home')
              }
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
                '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
              }}
            >
              Voir l&apos;annonce
            </Button>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(193, 53, 21, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              {status === 'declined' ? 'Paiement refusé' : finalFailed ? 'Confirmation en attente' : 'Paiement non confirmé'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {finalFailed
                ? 'Votre paiement a bien été initié mais la confirmation tarde. Vous pouvez revenir vérifier dans quelques minutes.'
                : isApproved
                ? 'Le paiement est en attente de confirmation. Réessayez dans quelques instants.'
                : "Le paiement n'a pas abouti. Aucun montant n'a été débité."}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
              {adId && (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    verifiedRef.current = false;
                    setVerifying(true);
                    setRetryCount(0);
                    setFinalFailed(false);
                    setIsUnlocked(false);
                    attemptVerify(0);
                  }}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                  }}
                >
                  Vérifier à nouveau
                </Button>
              )}
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<HomeIcon />}
                onClick={() => router.push('/home')}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
