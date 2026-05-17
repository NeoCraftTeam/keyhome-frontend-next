'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/AppLoader';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { brandAgent } from '@/theme/tokens';
import { useAuth as useClerkAuth, useClerk } from '@clerk/nextjs';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Custom OAuth SSO callback — zero Clerk hosted UI.
 *
 * Two visits:
 * 1. First visit (OAuth params in URL, isSignedIn=false): handleRedirectCallback
 *    processes the OAuth, creates the Clerk session, and navigates to
 *    redirectUrlComplete = /sso-callback (clean URL).
 * 2. Second visit (clean URL, isSignedIn=true): guard fires, AuthProvider
 *    calls clerkExchange and routes to /verify-otp or the right dashboard.
 *
 * If clerkExchange fails (API down, network error), AuthProvider now redirects
 * to login — but we still add an 8 s fallback here as a belt-and-suspenders
 * safety net.
 */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const { isLoaded, isSignedIn } = useClerkAuth();
  const router = useRouter();
  const handled = useRef(false);
  /** Single shared timeout ref — cleaned up on unmount regardless of which
   *  effect set it, so stale redirects never fire on the next page. */
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read intent synchronously (sessionStorage is available on the client immediately).
  const isAgentIntent =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('kh_registration_intent') === 'agent';

  // ─── Global cleanup – cancel any pending redirect when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // ─── Second visit: isSignedIn=true — AuthProvider is handling clerkExchange.
  // Add an 8 s fallback so the user is never stuck on the spinner indefinitely.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fallbackPath = isAgentIntent ? '/owner/dashboard' : '/home';
    timeoutRef.current = setTimeout(() => {
      console.warn(
        '[sso-callback] AuthProvider routing timed out — forcing fallback'
      );
      router.replace(fallbackPath);
    }, 8000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoaded, isSignedIn, isAgentIntent, router]);

  // ─── First visit: isSignedIn=false — process the OAuth callback.
  useEffect(() => {
    if (!isLoaded) return;
    // Post-callback re-entry: session already created — let AuthProvider route.
    if (isSignedIn) return;
    if (handled.current) return;

    handled.current = true;

    const origin = window.location.origin;
    // Fallback when Clerk has no stored redirectUrlComplete.
    const fallbackUrl = `${origin}/home`;
    // On hard errors (timeout / exception), redirect to context-appropriate login.
    const errorPath = isAgentIntent ? '/owner/login' : '/login';

    // Safety timeout — if Clerk hangs (e.g. Turnstile challenge), redirect after 10 s.
    // NOTE: we deliberately do NOT clear this in .then(). If handleRedirectCallback
    // navigates away the component unmounts and the cleanup above clears it. If it
    // resolves WITHOUT navigating (unusual), we want the timeout to fire as a net.
    timeoutRef.current = setTimeout(() => {
      console.warn('[sso-callback] Timed out waiting for Clerk redirect');
      router.replace(errorPath);
    }, 10000);

    // No complete-profile step — new OAuth users go directly to home/dashboard.
    // The backend finalizes the profile via clerkExchange; profile completion
    // happens inline on the dashboard via a banner component.
    const continueSignUpUrl = isAgentIntent ? '/owner/dashboard' : '/home';

    handleRedirectCallback({
      signInUrl: isAgentIntent ? '/owner/login' : '/login',
      signUpUrl: isAgentIntent ? '/register?role=agent' : '/register',
      signInFallbackRedirectUrl: fallbackUrl,
      signUpFallbackRedirectUrl: fallbackUrl,
      continueSignUpUrl,
    }).catch((err: unknown) => {
      // On error, cancel the timeout immediately (we're redirecting right now).
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      console.error('[sso-callback] handleRedirectCallback error:', err);
      router.replace(errorPath);
    });
  }, [handleRedirectCallback, router, isLoaded, isSignedIn, isAgentIntent]);

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
      <AppLoader
        size={48}
        color={isAgentIntent ? brandAgent.primary : undefined}
      />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Connexion en cours…
      </Typography>
    </Box>
  );
}
