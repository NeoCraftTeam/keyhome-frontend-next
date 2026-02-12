'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { paymentsService } from '@/services/payments.service';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const verifiedRef = useRef(false);

  const adId = searchParams.get('ad_id');
  const status = searchParams.get('status');
  const isApproved = status === 'approved';

  useEffect(() => {
    if (!adId || !isApproved || verifiedRef.current) {
      setVerifying(false);
      return;
    }

    verifiedRef.current = true;

    const verifyPayment = async () => {
      try {
        const result = await paymentsService.verify(adId);
        setIsUnlocked(result.is_unlocked);
      } catch {
        setIsUnlocked(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [adId, isApproved]);

  useEffect(() => {
    if (verifying || !isUnlocked) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (adId) {
            router.push(`/ads/${adId}/annonce?unlocked=1`);
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
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary">Vérification du paiement...</Typography>
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
          <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
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
                adId ? router.push(`/ads/${adId}/annonce?unlocked=1`) : router.push('/home')
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
              Paiement {status === 'declined' ? 'refusé' : 'non confirmé'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isApproved && !isUnlocked
                ? 'Le paiement est en attente de confirmation. Réessayez dans quelques instants.'
                : "Le paiement n'a pas abouti. Aucun montant n'a été débité."}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {adId && (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => router.push(`/ads/${adId}/annonce`)}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    background: 'linear-gradient(to right, #F6475F, #D93A50)',
                    '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                  }}
                >
                  Réessayer
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
