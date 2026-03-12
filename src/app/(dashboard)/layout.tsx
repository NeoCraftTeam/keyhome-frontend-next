'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import AppLoader from '@/components/ui/AppLoader';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { useAuth } from '@/providers/AuthProvider';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Pages we never want to save as post-login redirect targets */
const AUTH_PAGES = ['/login', '/register', '/verify-otp', '/verify-email', '/complete-profile'];

/**
 * Routes within the dashboard group that require the user to be authenticated.
 * Public routes (/home, /nearby) are accessible to guests for read-only browsing.
 */
const PRIVATE_PATHS = ['/profile', '/my/reservations'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasCheckedStoredToken, setHasCheckedStoredToken] = useState(false);
  const [hasStoredToken, setHasStoredToken] = useState(false);

  const isPrivatePage = PRIVATE_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    setHasStoredToken(!!localStorage.getItem('kh_sanctum_token'));
    setHasCheckedStoredToken(true);
  }, []);

  useEffect(() => {
    // Never redirect while the logout overlay is playing
    if (isLoggingOut) { return; }
    if (isPrivatePage && !isLoading && !isAuthenticated) {
      // Save where the user was so we can bring them back after re-auth
      const shouldSave = pathname && !AUTH_PAGES.some(p => pathname.startsWith(p)) && pathname !== '/';
      if (shouldSave) {
        sessionStorage.setItem('kh_redirect_after_login', pathname + window.location.search);
      }
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isLoggingOut, router, pathname, isPrivatePage]);

  // On first page load, wait until we know whether a persisted token exists.
  // If one exists, keep waiting until auth finishes hydrating to avoid
  // guest-first flashes before the authenticated UI appears.
  const shouldHoldForBootstrap =
    !hasCheckedStoredToken || (hasStoredToken && isLoading);

  if (!isLoggingOut && (shouldHoldForBootstrap || (isLoading && isPrivatePage))) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoader size={48} />
      </Box>
    );
  }

  // Block rendering of private pages until auth is confirmed.
  // Exception: while logging out, keep the layout alive so LogoutOverlay stays mounted.
  if (!isLoggingOut && !isAuthenticated && isPrivatePage) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
      <WelcomeModal />
      <LogoutOverlay />
    </Box>
  );
}
