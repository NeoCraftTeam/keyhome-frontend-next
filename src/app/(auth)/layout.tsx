'use client';

import AppLoader from '@/components/ui/AppLoader';
import SplashTransition from '@/components/ui/SplashTransition';
import { useAuth } from '@/providers/AuthProvider';
import { brandAgent } from '@/theme/tokens';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Minimum time (ms) the splash screen is visible — feels intentional, not like a flash. */
const SPLASH_DURATION = 1400;

/** Session key to track whether the user has already seen the auth splash this session */
const SPLASH_SEEN_KEY = 'kh_auth_splash_seen';

/** Pages that must always render even when isAuthenticated is true (post-registration). */
const VERIFICATION_PATHS = new Set(['/verify-email', '/verify-otp']);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * showSplash controls the SplashTransition overlay.
   * We show it on very first auth-group visit per session, but skip it
   * for subsequent intra-auth navigations (login↔register, verify-email, etc.)
   * to keep the flow snappy.
   *
   * IMPORTANT: never read sessionStorage during render — the server has no
   * sessionStorage so the server always gets `false` while the client may get
   * `true`, which causes a hydration mismatch.  Always default to `false` and
   * update the value inside useEffect (client-only, post-hydration).
   */
  const [showSplash, setShowSplash] = useState(false);
  const [isAgentSplash, setIsAgentSplash] = useState(false);
  const mountedRef = useRef(false);

  const isVerificationPath = VERIFICATION_PATHS.has(pathname ?? '');

  useEffect(() => {
    const alreadySeen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
    if (!alreadySeen) {
      setShowSplash(true);
    }
    setIsAgentSplash(
      sessionStorage.getItem('kh_registration_intent') === 'agent'
    );
    // Run once after hydration to decide whether to show the splash
  }, []);

  // Redirect authenticated users but only after the splash is done.
  // Never redirect from verification paths — those need to stay visible
  // even if the AuthProvider briefly reports isAuthenticated=true.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !showSplash && !isVerificationPath) {
      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else if (user?.role === 'agent') {
        router.replace('/owner/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    showSplash,
    isVerificationPath,
    user,
    router,
  ]);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    setShowSplash(false);
    mountedRef.current = true;
  }, []);

  // Show splash only on first auth-group visit this session
  if (showSplash) {
    return (
      <>
        <SplashTransition
          duration={SPLASH_DURATION}
          onComplete={handleSplashComplete}
          accentColor={isAgentSplash ? brandAgent.primary : undefined}
        />
        {/* Keep auth subtree mounted in background so it boots during splash */}
        <Box
          sx={{
            visibility: 'hidden',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {children}
        </Box>
      </>
    );
  }

  // Auth check still running after splash (edge case)
  if (isLoading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoader
          size={48}
          color={isAgentSplash ? brandAgent.primary : undefined}
        />
      </Box>
    );
  }

  // Block authenticated users from auth pages, but never from
  // verification pages (the user just registered and is mid-flow).
  if (isAuthenticated && !isVerificationPath) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
        animation: 'kh-auth-in 0.35s ease both',
        '@keyframes kh-auth-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {children}
    </Box>
  );
}
