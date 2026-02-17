'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    router.replace(token ? '/home' : '/login');
  }, [router]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress sx={{ color: '#F6475F' }} />
    </Box>
  );
}
