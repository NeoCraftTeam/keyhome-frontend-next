'use client';

import Navbar from '@/components/layout/Navbar';
import { Box } from '@mui/material';

export default function SondageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* Sticky navbar — never scrolls away */}
      <Box sx={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 1200 }}>
        <Navbar />
      </Box>

      {/* Survey content fills the remaining viewport exactly */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
