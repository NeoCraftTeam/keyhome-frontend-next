'use client';

import { paymentsService } from '@/services/payments.service';
import { FlutterwaveVerifyResponse } from '@/types';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home as HomeIcon,
  Refresh,
} from '@mui/icons-material';
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

const REDIRECT_DELAY_MS = 5000;
const MAX_VERIFY_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

type PageState = 'verifying' | 'success' | 'failed' | 'cancelled' | 'error';

function CallbackContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [result, setResult] = useState<FlutterwaveVerifyResponse | null>(null);
  const [countdown, setCountdown] = useState(5);

  const verifiedRef = useRef(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status'); // Flutterwave sends: successful | cancelled | failed

  const verify = useCallback(async (): Promise<void> => {
    const ref = txRef ?? sessionStorage.getItem('kh_flw_tx_ref');

    if (!ref) {
      setPageState('error');
      return;
    }

    // If user cancelled at Flutterwave checkout, notify backend immediately
    if (status === 'cancelled') {
      try {
        await paymentsService.flutterwaveCancel(ref);
      } catch {
        // Best-effort — backend may already have marked it
      }
      setPageState('cancelled');
      sessionStorage.removeItem('kh_flw_tx_ref');
      sessionStorage.removeItem('kh_flw_reference');
      return;
    }

    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_VERIFY_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }

      try {
        const data = await paymentsService.flutterwaveVerify(ref);
        setResult(data);

        if (data.status === 'success' || data.is_paid) {
          setPageState('success');
        } else if (data.status === 'failed') {
          setPageState('failed');
        } else if (data.status === 'cancelled') {
          setPageState('cancelled');
        } else if (status === 'cancelled') {
          setPageState('cancelled');
        } else {
          setPageState('failed');
        }
        return;
      } catch (err) {
        lastError = err;
      }
    }

    // All retries failed — fall back to URL status for display only
    console.error('Payment verify failed after retries:', lastError);
    if (status === 'successful') {
      setPageState('success');
    } else if (status === 'cancelled') {
      setPageState('cancelled');
    } else {
      setPageState('error');
    }

    sessionStorage.removeItem('kh_flw_tx_ref');
    sessionStorage.removeItem('kh_flw_reference');
  }, [txRef, status]);

  // Run verify once on mount
  useEffect(() => {
    if (verifiedRef.current) { return; }
    verifiedRef.current = true;
    verify();
  }, [verify]);

  // Auto-redirect countdown when terminal + success
  useEffect(() => {
    if (pageState !== 'success') { return; }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          const adId = result?.ad_id ?? null;
          // Redirect to unlocked ad page or home
          if (adId) {
            sessionStorage.setItem('kh_just_unlocked', adId);
            router.push(`/ads/${adId}/annonce`);
          } else {
            router.push('/home');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); }
    };
  }, [pageState, result, router]);

  // ── VERIFYING ──
  if (pageState === 'verifying') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3, p: 3 }}>
        <Image src="/images/logo.png" alt="KeyHome" width={52} height={52} style={{ marginBottom: 8 }} />
        <Typography variant="h6" fontWeight={600}>
          Vérification du paiement...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirmation en cours, merci de patienter.
        </Typography>
        <Box sx={{ width: '100%', maxWidth: 320 }}>
          <LinearProgress
            variant="indeterminate"
            sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#F6475F', borderRadius: 3 } }}
          />
        </Box>
      </Box>
    );
  }

  // ── TERMINAL STATES ──
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
          <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
        </Box>

        {pageState === 'success' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(0,138,5,0.1)',
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
              <CheckCircle sx={{ color: '#008A05', fontSize: 42 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Paiement confirmé !
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Votre paiement a bien été reçu. Vous allez être redirigé dans{' '}
              <strong>{countdown} seconde{countdown > 1 ? 's' : ''}</strong>.
            </Typography>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              href="/home"
              sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700, bgcolor: '#008A05', '&:hover': { bgcolor: '#007004' } }}
            >
              Retour à l&apos;accueil
            </Button>
            <Box sx={{ mt: 2.5 }}>
              <LinearProgress
                variant="determinate"
                value={((REDIRECT_DELAY_MS - countdown * 1000) / REDIRECT_DELAY_MS) * 100}
                sx={{ height: 4, borderRadius: 2, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: '#008A05' } }}
              />
            </Box>
          </>
        )}

        {(pageState === 'failed' || pageState === 'cancelled' || pageState === 'error') && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: pageState === 'cancelled' ? 'rgba(100,100,100,0.1)' : 'rgba(211,47,47,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon sx={{ color: pageState === 'cancelled' ? 'text.secondary' : '#D32F2F', fontSize: 42 }} />
            </Box>

            <Typography variant="h6" fontWeight={800} gutterBottom>
              {pageState === 'cancelled' ? 'Paiement annulé' : 'Paiement échoué'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {pageState === 'cancelled'
                ? 'Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.'
                : pageState === 'error'
                  ? 'Une erreur est survenue lors de la vérification. Consultez votre historique de paiements.'
                  : 'Le paiement n\'a pas pu être traité. Veuillez réessayer ou choisir un autre moyen de paiement.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => router.back()}
                sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 600 }}
              >
                Réessayer
              </Button>
              <Button
                variant="text"
                startIcon={<HomeIcon />}
                href="/home"
                sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 600, color: 'text.secondary' }}
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

export default function PaymentCallbackPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LinearProgress sx={{ width: 200 }} />
        </Box>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
