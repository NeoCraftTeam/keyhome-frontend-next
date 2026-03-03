'use client';

import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Box } from '@mui/material';

/**
 * Public layout for ad detail pages.
 * This is intentionally outside the (dashboard) group so that
 * Googlebot can crawl and index ad pages without authentication.
 * Shares the same Navbar / Footer as the dashboard for a consistent UX.
 */
export default function AdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

