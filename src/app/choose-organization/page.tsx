'use client';

export const dynamic = 'force-dynamic';

import AppLoader from '@/components/ui/feedback/AppLoader';
import {
  getOAuthCallbackPath,
  isAgentRegistrationIntent,
} from '@/lib/auth/oauth-redirect';
import { OWNER_LOGO_SRC } from '@/lib/owner/owner-auth-assets';
import { TaskChooseOrganization } from '@clerk/nextjs';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Clerk session task — required when Organizations are enabled in the Clerk
 * Dashboard. Routes here via ClerkProvider `taskUrls` instead of /login#/tasks/…
 */
export default function ChooseOrganizationPage() {
  const router = useRouter();
  const [isAgentIntent, setIsAgentIntent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsAgentIntent(isAgentRegistrationIntent());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoader size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        gap: 3,
        px: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Image
          src={isAgentIntent ? OWNER_LOGO_SRC : '/images/logo.png'}
          alt="KeyHome"
          width={48}
          height={48}
        />
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: isAgentIntent ? '#0d9488' : 'primary.main' }}
        >
          {isAgentIntent ? 'KeyHome Business' : 'KeyHome'}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <TaskChooseOrganization
          redirectUrlComplete={getOAuthCallbackPath()}
          appearance={{
            elements: {
              rootBox: { width: '100%' },
            },
          }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Finalisez votre connexion pour accéder à{' '}
        {isAgentIntent ? 'votre espace bailleur' : 'KeyHome'}.
      </Typography>

      <Typography
        component="button"
        type="button"
        variant="caption"
        color="text.secondary"
        onClick={() =>
          router.replace(isAgentIntent ? '/owner/login' : '/login')
        }
        sx={{
          border: 0,
          bgcolor: 'transparent',
          cursor: 'pointer',
          textDecoration: 'underline',
          minHeight: 44,
        }}
      >
        Retour à la connexion
      </Typography>
    </Box>
  );
}
