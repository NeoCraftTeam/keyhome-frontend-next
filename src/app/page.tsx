'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/providers/AuthProvider';
import LandingPage from '@/components/landing/LandingPage';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner only while checking auth
  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#F6475F' }} />
      </Box>
    );
  }

  // Authenticated → redirect (handled above), show nothing during transition
  if (isAuthenticated) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#F6475F' }} />
      </Box>
    );
  }

  // Unauthenticated → show landing page
  return <LandingPage />;
}
