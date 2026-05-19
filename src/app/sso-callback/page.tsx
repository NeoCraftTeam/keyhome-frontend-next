'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/AppLoader';
import { OWNER_LOGO_SRC } from '@/lib/owner-auth-assets';
import { brandAgent } from '@/theme/tokens';
import { useClerk, useAuth as useClerkAuth, useSignUp } from '@clerk/nextjs';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  const handled = useRef(false);
  const legalHandled = useRef(false);
  /** Single shared timeout ref — cleaned up on unmount regardless of which
   *  effect set it, so stale redirects never fire on the next page. */
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // RC-8: Read sessionStorage synchronously via a ref initialised at mount.
  // sso-callback is 'use client' + 'force-dynamic' — never server-rendered —
  // so window/sessionStorage are always available when the module executes.
  // A ref avoids the one-render lag that a useState+useEffect pair introduces:
  // with that pattern the first render sees `false`, and any effect that also
  // runs on that first render (e.g. handleRedirectCallback) captures the stale
  // value before the state update from the second effect can flush.
  const isAgentIntentRef = useRef(
    typeof window !== 'undefined' &&
      sessionStorage.getItem('kh_registration_intent') === 'agent'
  );
  // Derived state — used ONLY for UI rendering (logo, colour, label).
  // All routing/logic must use isAgentIntentRef.current.
  const [isAgentIntent, setIsAgentIntent] = useState(
    typeof window !== 'undefined' &&
      sessionStorage.getItem('kh_registration_intent') === 'agent'
  );
  // Keep derived state in sync in case the ref value changes (e.g. StrictMode
  // double-invoke with different storage contents between invocations).
  useEffect(() => {
    const stored = sessionStorage.getItem('kh_registration_intent') === 'agent';
    isAgentIntentRef.current = stored;
    setIsAgentIntent(stored);
  }, []);

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
  // Use isAgentIntentRef.current (synchronous) so the correct path is captured
  // even if the derived `isAgentIntent` state hasn't flushed yet.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fallbackPath = isAgentIntentRef.current
      ? '/owner/dashboard'
      : '/home';
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
  }, [isLoaded, isSignedIn, router]);

  // ─── First visit: isSignedIn=false — process the OAuth callback.
  useEffect(() => {
    if (!isLoaded) return;
    // Post-callback re-entry: session already created — let AuthProvider route.
    if (isSignedIn) return;
    if (handled.current) return;

    handled.current = true;

    // Read the intent from the ref — synchronously set at mount, so this value
    // is always correct even on the very first effect run (unlike a state value
    // that lags one render behind when set inside a useEffect).
    const agentIntent = isAgentIntentRef.current;

    const origin = window.location.origin;
    // Fallback when Clerk has no stored redirectUrlComplete.
    const fallbackUrl = `${origin}/home`;
    // On hard errors (timeout / exception), redirect to context-appropriate login.
    const errorPath = agentIntent ? '/owner/login' : '/login';

    // Safety timeout — if Clerk hangs (e.g. Turnstile challenge), redirect after 10 s.
    // NOTE: we deliberately do NOT clear this in .then(). If handleRedirectCallback
    // navigates away the component unmounts and the cleanup above clears it. If it
    // resolves WITHOUT navigating (unusual), we want the timeout to fire as a net.
    timeoutRef.current = setTimeout(() => {
      console.warn('[sso-callback] Timed out waiting for Clerk redirect');
      router.replace(errorPath);
    }, 10000);

    // Redirect back to /sso-callback so we can handle missing_requirements
    // (e.g. legal_accepted) before navigating to the final destination.
    const continueSignUpUrl = `${origin}/sso-callback`;

    handleRedirectCallback({
      signInUrl: agentIntent ? '/owner/login' : '/login',
      signUpUrl: agentIntent ? '/register?role=agent' : '/register',
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
  }, [handleRedirectCallback, router, isLoaded, isSignedIn]);

  // ─── Handle missing legal_accepted — Clerk blocks sign-up if ToS acceptance
  // is required. After handleRedirectCallback navigates back here via
  // continueSignUpUrl=/sso-callback, signUp.status becomes 'missing_requirements'.
  // We accept programmatically (user clicked OAuth = implicit ToS agreement) so
  // Clerk can complete the sign-up and create the session.
  useEffect(() => {
    if (!isSignUpLoaded || !signUp) return;
    if (signUp.status !== 'missing_requirements') return;
    if (!signUp.missingFields?.includes('legal_accepted')) return;
    if (legalHandled.current) return;

    legalHandled.current = true;

    const agentIntent = isAgentIntentRef.current;
    const errorPath = agentIntent ? '/owner/login' : '/login';

    signUp.update({ legalAccepted: true }).catch((err: unknown) => {
      console.error('[sso-callback] legal_accepted update failed:', err);
      router.replace(errorPath);
    });
  }, [isSignUpLoaded, signUp, signUp?.status, router]);

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
