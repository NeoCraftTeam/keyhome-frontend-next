'use client';

import BottomNav, { BOTTOM_NAV_HEIGHT } from '@/components/layout/BottomNav';
import Navbar from '@/components/layout/Navbar';
import { useIsStandalone } from '@/hooks/useIsStandalone';
import { Box, useMediaQuery, useTheme } from '@mui/material';

export default function SearchLayoutClient({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isStandalone = useIsStandalone();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flex: 1,
          overflow: 'hidden',
          pb: isMobile && isStandalone ? `${BOTTOM_NAV_HEIGHT}px` : 0,
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
