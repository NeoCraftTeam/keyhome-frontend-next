'use client';

import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService, OAuthProvider } from '@/services/auth.service';
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
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');
    const provider = sessionStorage.getItem('oauth_provider') as OAuthProvider | null;

    // Clear stored provider
    sessionStorage.removeItem('oauth_provider');

    // Check for OAuth errors
    if (errorParam) {
      const errorDescription = searchParams.get('error_description') || 'Connexion annulée';
      setError(errorDescription);
      return;
    }

    // Validate required params
    if (!code) {
      setError('Code d\'autorisation manquant');
      return;
    }

    if (!provider) {
      setError('Provider OAuth non trouvé');
      return;
    }

    try {
      const response = await authService.handleOAuthCallback(provider, code, state);

      // Store token and user
      sessionStorage.setItem('token', response.token);
      sessionStorage.setItem('user_id', response.user.id);
      setUser(response.user);

      // Redirect to home
      router.replace('/home');
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(getSafeErrorMessage(err, 'Erreur lors de la connexion. Veuillez réessayer.'));
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
        <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
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
