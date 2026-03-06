'use client';

import { creditsService } from '@/services/credits.service';
import {
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty as HourglassIcon,
  Home as HomeIcon,
  Toll,
} from '@mui/icons-material';
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

const MAX_RETRIES = 20;
const INITIAL_RETRY_MS = 800;
const MAX_RETRY_MS = 5000;
const EXTENDED_POLL_MS = 5000;
const EXTENDED_MAX_RETRIES = 36;

function CreditCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState<'completed' | 'pending' | 'failed' | null>(null);
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [extendedPolling, setExtendedPolling] = useState(false);
  const verifiedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adId = searchParams.get('ad_id');
  const status = searchParams.get('status');
  const isApproved = status === 'approved';

  const attemptVerify = useCallback(async (attempt: number) => {
    try {
      const result = await creditsService.verifyPurchase();
      setPointBalance(result.point_balance);

      if (result.status === 'completed') {
        setPurchaseStatus('completed');
        setVerifying(false);
        return;
      }
      if (result.status === 'failed') {
        setPurchaseStatus('failed');
        setVerifying(false);
        return;
      }
    } catch {
      // swallow — will retry
    }

    if (attempt < MAX_RETRIES) {
      setRetryCount(attempt + 1);
      const delay = Math.min(INITIAL_RETRY_MS * Math.pow(1.5, attempt), MAX_RETRY_MS);
      retryTimerRef.current = setTimeout(() => attemptVerify(attempt + 1), delay);
    } else {
      setExtendedPolling(true);
      setVerifying(false);
    }
  }, []);

  const extendedPoll = useCallback(async (attempt: number) => {
    try {
      const result = await creditsService.verifyPurchase();
      setPointBalance(result.point_balance);

      if (result.status === 'completed') {
        setPurchaseStatus('completed');
        setExtendedPolling(false);
        return;
      }
      if (result.status === 'failed') {
        setPurchaseStatus('failed');
        setExtendedPolling(false);
        return;
      }
    } catch { /* swallow */ }

    if (attempt < EXTENDED_MAX_RETRIES) {
      retryTimerRef.current = setTimeout(() => extendedPoll(attempt + 1), EXTENDED_POLL_MS);
    } else {
      setPurchaseStatus('pending');
      setExtendedPolling(false);
    }
  }, []);

  useEffect(() => {
    if (!isApproved || verifiedRef.current) {
      if (!isApproved) {
        setPurchaseStatus(status === 'declined' ? 'failed' : 'pending');
        setVerifying(false);
      }
      return;
    }
    verifiedRef.current = true;
    attemptVerify(0);
    return () => { if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); } };
  }, [isApproved, status, attemptVerify]);

  useEffect(() => {
    if (!extendedPolling || purchaseStatus === 'completed') { return; }
    extendedPoll(0);
    return () => { if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); } };
  }, [extendedPolling, purchaseStatus, extendedPoll]);

  if (verifying) {
    const progress = (retryCount / MAX_RETRIES) * 100;
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, p: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Image src="/images/logo.png" alt="KeyHome" width={52} height={52} style={{ marginBottom: 16 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Vérification du paiement...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {retryCount === 0
              ? 'Confirmation en cours, merci de patienter.'
              : `Tentative ${retryCount + 1} / ${MAX_RETRIES + 1} — Confirmation en cours.`}
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
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
          <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
        </Box>

        {purchaseStatus === 'completed' ? (
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

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {adId ? (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => router.push(`/ads/${adId}/annonce`)}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  Déverrouiller l&apos;annonce
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => router.push('/home')}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                    '&:active': { transform: 'scale(0.97)' },
                  }}
                >
                  Explorer les annonces
                </Button>
              )}
            </Box>
          </>
        ) : purchaseStatus === 'failed' ? (
          <>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(193,53,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Paiement échoué
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Le paiement n&apos;a pas abouti. Aucun montant n&apos;a été débité.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => adId ? router.push(`/ads/${adId}/annonce`) : router.push('/home')}
              sx={{
                py: 1.5,
                fontWeight: 600,
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
                '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              Réessayer
            </Button>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: 'rgba(246, 71, 95, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.06)', opacity: 0.85 },
                },
              }}
            >
              <HourglassIcon sx={{ fontSize: 44, color: '#F6475F' }} />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              Confirmation en cours…
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              Votre paiement a bien été reçu. La confirmation bancaire peut prendre quelques instants.
            </Typography>

            {extendedPolling && (
              <Box sx={{ width: '100%', mb: 3 }}>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'rgba(246,71,95,0.12)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#F6475F', borderRadius: 2 },
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column', mt: 2 }}>
              {adId && (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => router.push(`/ads/${adId}/annonce`)}
                  sx={{ py: 1.5, fontWeight: 600, borderColor: '#F6475F', color: '#F6475F', '&:hover': { borderColor: '#D93A50', color: '#D93A50', bgcolor: 'rgba(246,71,95,0.05)' } }}
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
      </Paper>
    </Box>
  );
}

export default function CreditCallbackPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <CreditCallbackContent />
    </Suspense>
  );
}
