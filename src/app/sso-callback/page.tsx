'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/AppLoader';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
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
  // isLoaded + isSignedIn let us detect the post-callback re-entry:
  // after Clerk processes the OAuth and redirects back to /sso-callback
  // (redirectUrlComplete), the session is already created. We must NOT call
  // handleRedirectCallback again — just let AuthProvider drive the routing.
  const { isLoaded, isSignedIn } = useClerkAuth();
  const router = useRouter();
  const handled = useRef(false);

  // Read intent synchronously — safe on client, sessionStorage is available immediately.
  const isAgentIntent =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('kh_registration_intent') === 'agent';

  useEffect(() => {
    // Not ready yet — wait for Clerk SDK to finish loading.
    if (!isLoaded) {
      return;
    }

    // Race-condition guard: Clerk has already created the session
    // (post-callback re-entry via redirectUrlComplete = /sso-callback).
    // handleRedirectCallback must NOT run twice — let AuthProvider handle
    // the clerkExchange and route to /verify-otp or /owner/dashboard.
    if (isSignedIn) {
      return;
    }

    if (handled.current) {
      return;
    }

    handled.current = true;

    const origin = window.location.origin;

    // Fallback destination when Clerk has no stored redirectUrlComplete.
    // Always use /home — never a login page. AuthProvider will route to the
    // correct dashboard once clerkExchange resolves the user’s role.
    const fallbackUrl = `${origin}/home`;
    // On hard errors (timeout / Clerk exception), redirect to the context-
    // appropriate login so the user can retry — but this path is rare.
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
  }, [handleRedirectCallback, router, isLoaded, isSignedIn]);

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
          src={isAgentIntent ? OWNER_LOGO_SRC : '/images/logo.png'}
          alt="KeyHome — Authentification"
          width={48}
          height={48}
        />
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: isAgentIntent ? '#0d9488' : 'primary.main' }}
        >
          {isAgentIntent ? 'KeyHome Business' : 'KeyHome'}
        </Typography>
      </Box>
      <AppLoader size={48} />
      <Typography variant="body2" color="text.secondary">
        Connexion en cours…
      </Typography>
    </Box>
  );
}
