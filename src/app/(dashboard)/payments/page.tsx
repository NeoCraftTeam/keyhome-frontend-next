'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Button, Paper } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Home as HomeIcon } from '@mui/icons-material';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const adId = searchParams.get('ad_id');

  const isSuccess = status === 'approved' || status === 'success';

  useEffect(() => {
    if (isSuccess && adId) {
      const timer = setTimeout(() => {
        router.push(`/ads/${adId}/?unlocked=1`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, adId, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          maxWidth: 440,
        }}
      >
        {isSuccess ? (
          <>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Paiement réussi
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              L&apos;annonce a été déverrouillée. Vous allez être redirigé automatiquement.
            </Typography>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            {adId && (
              <Button
                fullWidth
                variant="contained"
                onClick={() => router.push(`/ads/${adId}/?unlocked=1`)}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                }}
              >
                Voir l&apos;annonce
              </Button>
            )}
          </>
        ) : (
          <>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Paiement échoué
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Le paiement n&apos;a pas abouti. Veuillez réessayer.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => router.push('/home')}
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(to right, #F6475F, #D93A50)',
              }}
            >
              Retour à l&apos;accueil
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
      <PaymentContent />
    </Suspense>
  );
}
