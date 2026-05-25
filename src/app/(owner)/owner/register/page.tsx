'use client';

import {
  writeStoredRegisterAccountRole,
  writeStoredRegisterLock,
} from '@/lib/auth/register-intent';
import { brandAgent } from '@/theme/tokens';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLayoutEffect } from 'react';

/**
 * L'inscription bailleur utilise la même page que les clients (`/register`),
 * avec présélection « Agent » via sessionStorage (pas de `?role=` dans l’URL).
 */
export default function OwnerRegisterRedirectPage() {
  const router = useRouter();

  useLayoutEffect(() => {
    writeStoredRegisterAccountRole('agent');
    writeStoredRegisterLock();
    router.replace('/register');
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress sx={{ color: brandAgent.primary }} />
    </Box>
  );
}
