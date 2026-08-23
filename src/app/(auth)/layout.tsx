'use client';

import AppLoader from '@/components/ui/feedback/AppLoader';
import { consumeReturnTo } from '@/lib/auth/return-to';
import { useAuth } from '@/providers/AuthProvider';
import { brandAgent } from '@/theme/tokens';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

  /** Agent registration flow tints the loader with the agent brand colour. */
  const [isAgentContext, setIsAgentContext] = useState(false);
  /**
   * Tracks whether this layout observed a resolved-guest state
   * (isLoading=false + isAuthenticated=false) before the user became
   * authenticated.  When true it means login() was called and already
   * initiated the post-login navigation — AuthLayout must NOT issue a
   * second router.replace() that would override the returnTo redirect.
   * When false the user was already authenticated on page load (e.g. they
   * bookmarked /login) and AuthLayout is the sole redirect handler.
   */
  const wasGuestRef = useRef(false);

  const isVerificationPath = VERIFICATION_PATHS.has(pathname ?? '');

  useEffect(() => {
    setIsAgentContext(
      sessionStorage.getItem('kh_registration_intent') === 'agent'
    );
  }, []);

  // Track resolved-guest state so the redirect effect below can tell the
  // difference between "already authenticated on load" vs "just logged in".
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      wasGuestRef.current = true;
    }
  }, [isLoading, isAuthenticated]);

  // Redirect authenticated users away from auth pages. Never redirect from
  // verification paths — those need to stay visible even if the AuthProvider
  // briefly reports isAuthenticated=true. Skip when wasGuestRef is true:
  // login() already called router.replace() and a second navigation here
  // would override the correct returnTo target.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isVerificationPath) {
      if (wasGuestRef.current) {
        return;
      }
      // Read from the key matching the user's own space, so an agent landing
      // here is never sent to a stale client destination.
      router.replace(
        consumeReturnTo(user?.role === 'agent' ? 'owner' : 'client')
      );
    }
  }, [isAuthenticated, isLoading, isVerificationPath, user, router]);

  // Auth resolution still running: a lightweight loader — never a blocking
  // splash. The auth form must appear as soon as the state resolves.
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
          color={isAgentContext ? brandAgent.primary : undefined}
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
