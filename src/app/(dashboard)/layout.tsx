'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import LogoutOverlay from '@/components/ui/LogoutOverlay';
import WelcomeModal from '@/components/ui/WelcomeModal';
import { useAuth } from '@/providers/AuthProvider';
import { Box, CircularProgress } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Pages we never want to save as post-login redirect targets */
const AUTH_PAGES = ['/login', '/register', '/verify-otp', '/verify-email', '/complete-profile'];

/**
 * Routes within the dashboard group that require the user to be authenticated.
 * Public routes (/home, /nearby) are accessible to guests for read-only browsing.
 */
const PRIVATE_PATHS = ['/profile'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPrivatePage = PRIVATE_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (isPrivatePage && !isLoading && !isAuthenticated) {
      // Save where the user was so we can bring them back after re-auth
      const shouldSave = pathname && !AUTH_PAGES.some(p => pathname.startsWith(p)) && pathname !== '/';
      if (shouldSave) {
        sessionStorage.setItem('kh_redirect_after_login', pathname + window.location.search);
      }
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname, isPrivatePage]);

  // Show a full-screen spinner while auth state is resolving on private pages
  if (isLoading && isPrivatePage) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  // Block rendering of private pages until auth is confirmed
  if (!isAuthenticated && isPrivatePage) {
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
