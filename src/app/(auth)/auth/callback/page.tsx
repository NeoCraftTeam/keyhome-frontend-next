'use client';

export const dynamic = 'force-dynamic';

import api from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleCallback = useCallback(async () => {
    // The backend OAuth callback redirects here with token in query params
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const errorMessage = searchParams.get('message');

    // Clear stored provider
    sessionStorage.removeItem('oauth_provider');

    // Check for OAuth errors
    if (errorParam || errorMessage) {
      setError(errorMessage || errorParam || 'Connexion annulée');
      return;
    }

    // Check if we have a token from backend redirect
    if (!token) {
      setError('Token d\'authentification manquant');
      return;
    }

    try {
      // Store token
      sessionStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user info
      const { data } = await api.get('/auth/me');
      const user = data.data ?? data;

      // Store user
      sessionStorage.setItem('user_id', user.id);
      setUser(user);

      // Redirect to home
      router.replace('/home');
    } catch (err) {
      console.error('OAuth callback error:', err);
      sessionStorage.removeItem('token');
      setError('Erreur lors de la récupération du profil. Veuillez réessayer.');
    }
  }, [searchParams, router, setUser]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

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
