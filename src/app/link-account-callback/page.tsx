'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/AppLoader';
import { useUser } from '@clerk/nextjs';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * OAuth callback page for account linking via LinkedAccountsCard.
 *
 * Clerk redirects here after the user completes the OAuth handshake when
 * linking a social account (Google, Facebook, GitHub) to their existing
 * KeyHome account. The URL contains Clerk verification params
 * (__clerk_ticket, __clerk_status) that need to be consumed.
 *
 * Flow:
 * 1. LinkedAccountsCard calls user.createExternalAccount() and stores
 *    the return path in sessionStorage (kh_link_return_path).
 * 2. User completes OAuth on the provider's site.
 * 3. Clerk redirects here with __clerk_ticket / __clerk_status params.
 * 4. We call user.reload() to finalize the newly linked account on the
 *    Clerk session — this is the equivalent of handleRedirectCallback but
 *    for the account-linking case (not sign-in/sign-up).
 * 5. Redirect back to the settings page.
 *
 * Note: `handleExternalAccountVerification` does not exist in @clerk/nextjs
 * v6. The correct approach for account linking is user.reload(), which
 * re-fetches the Clerk user object with the now-verified external account.
 */
export default function LinkAccountCallbackPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (handled.current) return;
    handled.current = true;

    const returnPath =
      (typeof window !== 'undefined' &&
        sessionStorage.getItem('kh_link_return_path')) ||
      '/parametres';

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kh_link_return_path');
    }

    const finish = () => router.replace(returnPath);

    if (!user) {
      // Not signed in — just navigate back.
      finish();
      return;
    }

    // Reload refreshes the Clerk user object so the newly linked external
    // account is visible immediately on the settings page we return to.
    user.reload().then(finish).catch(finish);
  }, [isLoaded, user, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <AppLoader size={48} />
      <Typography variant="body2" color="text.secondary">
        Liaison du compte en cours…
      </Typography>
    </Box>
  );
}
