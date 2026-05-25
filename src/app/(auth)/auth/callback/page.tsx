'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/feedback/AppLoader';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { Alert, Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { finalizeAuth } = useAuth();
  const redeemed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const exchangeCode = searchParams.get('exchange_code');
  const queryError = searchParams.get('message') || searchParams.get('error');

  useEffect(() => {
    if (redeemed.current) {
      return;
    }

    if (queryError && !exchangeCode) {
      setError(queryError);
      return;
    }

    if (!exchangeCode) {
      setError(
        'Lien de connexion invalide ou expiré. Utilisez les boutons sociaux sur la page de connexion.'
      );
      return;
    }

    redeemed.current = true;

    void (async () => {
      try {
        const { token, user } =
          await authService.completeOAuthExchange(exchangeCode);
        finalizeAuth(token, user, null);
      } catch (err) {
        console.error('[auth/callback] OAuth exchange failed:', err);
        setError(
          getSafeErrorMessage(
            err,
            'Impossible de finaliser la connexion. Veuillez réessayer.'
          )
        );
      }
    })();
  }, [exchangeCode, finalizeAuth, queryError, router]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 4000);

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
        <Image
          src="/images/logo.png"
          alt="KeyHome — Connexion en cours"
          width={48}
          height={48}
        />
        <Typography variant="h4" fontWeight={700} color="primary.main">
          KeyHome
        </Typography>
      </Box>

      {error ? (
        <Box sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Redirection vers la connexion…
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <AppLoader size={48} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Connexion en cours…
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
          <AppLoader size={48} />
        </Box>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
