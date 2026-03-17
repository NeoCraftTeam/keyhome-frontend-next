'use client';

import BottomNav, { BOTTOM_NAV_HEIGHT } from '@/components/layout/BottomNav';
import Navbar from '@/components/layout/Navbar';
import { Box, useMediaQuery, useTheme } from '@mui/material';

export default function SearchLayoutClient({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'hidden',
          pb: isMobile ? `${BOTTOM_NAV_HEIGHT}px` : 0,
        }}
      >
        {children}
      </Box>
      <BottomNav />
    </Box>
  );
}
