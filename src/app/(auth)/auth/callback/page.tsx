'use client';

export const dynamic = 'force-dynamic';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = useMemo(() => {
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    return errorMessage || errorParam || 'Cette route OAuth est obsolete. Veuillez vous reconnecter.';
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1800);

    return () => clearTimeout(timer);
  }, [error, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Image src="/images/logo.png" alt="KeyHome — Connexion en cours" width={48} height={48} />
        <Typography variant="h4" fontWeight={700} color="primary.main">
          KeyHome
        </Typography>
      </Box>

      {error ? (
        <Box sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
          <Typography
            component="a"
            href="/login"
            sx={{
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Retour à la connexion
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="h6" color="text.secondary">
            Connexion en cours...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function OAuthCallbackPage() {
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
          <CircularProgress size={48} />
        </Box>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
