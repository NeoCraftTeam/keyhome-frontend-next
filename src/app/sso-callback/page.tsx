'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/AppLoader';
import { useClerk } from '@clerk/nextjs';
import { Box, Typography } from '@mui/material';
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

    const origin = window.location.origin;
    const isAgentIntent =
      sessionStorage.getItem('kh_registration_intent') === 'agent';
    const fallbackUrl = isAgentIntent
      ? `${origin}/owner/login`
      : `${origin}/home`;
    const errorPath = isAgentIntent ? '/owner/login' : '/login';

    // Safety timeout — if Clerk hangs (e.g. Turnstile challenge), redirect after 10s
    const timeout = setTimeout(() => {
      console.warn('[sso-callback] Timed out waiting for Clerk redirect');
      router.replace(errorPath);
    }, 10000);

    const continueSignUpUrl = isAgentIntent
      ? '/owner/auth/complete-profile'
      : '/complete-profile';

    handleRedirectCallback({
      signInUrl: isAgentIntent ? '/owner/login' : '/login',
      signUpUrl: isAgentIntent ? '/register?role=agent' : '/register',
      signInFallbackRedirectUrl: fallbackUrl,
      signUpFallbackRedirectUrl: fallbackUrl,
      continueSignUpUrl,
    })
      .then(() => clearTimeout(timeout))
      .catch((err: unknown) => {
        clearTimeout(timeout);
        console.error('[sso-callback] handleRedirectCallback error:', err);
        router.replace(errorPath);
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
        <Image
          src="/images/logo.png"
          alt="KeyHome — Authentification"
          width={48}
          height={48}
        />
        <Typography variant="h5" fontWeight={700} color="primary.main">
          KeyHome
        </Typography>
      </Box>
      <AppLoader size={48} />
      <Typography variant="body2" color="text.secondary">
        Connexion en cours…
      </Typography>
    </Box>
  );
}
