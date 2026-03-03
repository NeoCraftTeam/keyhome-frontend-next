'use client';

import Navbar from '@/components/layout/Navbar';
import { Box } from '@mui/material';

export default function SearchLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  );
}
