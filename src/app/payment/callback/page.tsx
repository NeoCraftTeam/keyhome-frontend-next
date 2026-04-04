'use client';

import AppLoader from '@/components/ui/AppLoader';
import { paymentsService } from '@/services/payments.service';
import { FlutterwaveVerifyResponse } from '@/types';
import ErrorIcon from '@mui/icons-material/Error';
import Refresh from '@mui/icons-material/Refresh';
import { Box, Button, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

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
    const ref = txRef;

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
  }, [txRef, status]);

  // Run verify once on mount
  useEffect(() => {
    if (verifiedRef.current) {
      return;
    }
    verifiedRef.current = true;
    queueMicrotask(() => {
      void verify();
    });
  }, [verify]);

  // Auto-redirect countdown when terminal + success
  useEffect(() => {
    if (pageState !== 'success') {
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          const adId = result?.ad_id ?? null;
          // Redirect to unlocked ad page or home
          if (adId) {
            sessionStorage.setItem('kh_just_unlocked', adId);
            router.push(`/ads/${adId}`);
          } else {
            router.push('/home');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [pageState, result, router]);

  // ── VERIFYING ──
  if (pageState === 'verifying') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Image
            src="/images/logo.png"
            alt="KeyHome — Paiement"
            width={48}
            height={48}
          />
          <Typography variant="h5" fontWeight={700} color="primary.main">
            KeyHome
          </Typography>
        </Box>
        <AppLoader size={48} />
        <Typography variant="body2" fontWeight={600}>
          Vérification du paiement...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirmation en cours, merci de patienter.
        </Typography>
      </Box>
    );
  }

  // ── SUCCESS (loader-style redirect screen) ──
  if (pageState === 'success') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Image
            src="/images/logo.png"
            alt="KeyHome — Paiement confirmé"
            width={48}
            height={48}
          />
          <Typography variant="h5" fontWeight={700} color="primary.main">
            KeyHome
          </Typography>
        </Box>
        <AppLoader size={48} />
        <Typography variant="body1" fontWeight={700}>
          Paiement confirmé !
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Redirection en cours dans{' '}
          <strong>
            {countdown} seconde{countdown > 1 ? 's' : ''}
          </strong>
          ...
        </Typography>
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

        {(pageState === 'failed' ||
          pageState === 'cancelled' ||
          pageState === 'error') && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor:
                  pageState === 'cancelled'
                    ? 'rgba(100,100,100,0.1)'
                    : 'rgba(211,47,47,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorIcon
                sx={{
                  color:
                    pageState === 'cancelled' ? 'text.secondary' : '#D32F2F',
                  fontSize: 42,
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={800} gutterBottom>
              {pageState === 'cancelled'
                ? 'Paiement annulé'
                : 'Paiement échoué'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {pageState === 'cancelled'
                ? 'Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.'
                : pageState === 'error'
                  ? 'Une erreur est survenue lors de la vérification. Consultez votre historique de paiements.'
                  : "Le paiement n'a pas pu être traité. Veuillez réessayer ou choisir un autre moyen de paiement."}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                startIcon={pageState !== 'cancelled' ? <Refresh /> : undefined}
                onClick={() => router.back()}
                sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 600 }}
              >
                {pageState === 'cancelled' ? 'Retour' : 'Réessayer'}
              </Button>
              <Button
                variant="text"
                href="/home"
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
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
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoader size={48} />
        </Box>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
