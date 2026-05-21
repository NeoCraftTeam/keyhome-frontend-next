'use client';

import BottomNav from '@/components/layout/BottomNav';
import Navbar from '@/components/layout/Navbar';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { PWA_BOTTOM_NAV_INNER_HEIGHT_PX } from '@/lib/pwaBottomNavConstants';
import { Box, useMediaQuery, useTheme } from '@mui/material';

export default function SearchLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Navbar />
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          pb:
            isMobile && isStandalone
              ? `${PWA_BOTTOM_NAV_INNER_HEIGHT_PX}px`
              : 0,
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
