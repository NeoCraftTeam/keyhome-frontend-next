'use client';

export const dynamic = 'force-dynamic';

import { useClerk } from '@clerk/nextjs';
import { Box, CircularProgress, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Custom OAuth SSO callback — zero Clerk hosted UI.
 * Uses Clerk's low-level handleRedirectCallback to intercept missing_requirements
 * and redirect to our own /complete-profile page instead of Clerk's hosted page.
 */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }

    handled.current = true;

    handleRedirectCallback({
      signInUrl: '/login',
      signUpUrl: '/login',
      signInFallbackRedirectUrl: '/home',
      signUpFallbackRedirectUrl: '/home',
      continueSignUpUrl: '/complete-profile',
    }).catch(() => {
      router.replace('/login');
    });
  }, [handleRedirectCallback, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />
        <Typography variant="h5" fontWeight={700} color="primary.main">
          KeyHome
        </Typography>
      </Box>
      <CircularProgress sx={{ color: 'primary.main' }} />
      <Typography variant="body2" color="text.secondary">
        Connexion en cours…
      </Typography>
    </Box>
  );
}

