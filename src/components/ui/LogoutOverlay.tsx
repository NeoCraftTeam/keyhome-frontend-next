'use client';

import { useAuth } from '@/providers/AuthProvider';
import Image from 'next/image';
import { Box, Typography } from '@mui/material';

/**
 * Full-screen overlay shown during logout.
 * Displays the KeyHome logo with a clean fade/scale animation
 * and a farewell message before redirecting.
 */
export default function LogoutOverlay() {
  const { isLoggingOut } = useAuth();

  if (!isLoggingOut) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        animation: 'logoutFadeIn 0.4s ease-out',
        '@keyframes logoutFadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {/* Animated logo */}
      <Box
        sx={{
          mb: 3,
          animation: 'logoutPulse 1.2s ease-in-out infinite',
          '@keyframes logoutPulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
            '50%': { transform: 'scale(1.06)', opacity: 1 },
          },
        }}
      >
        <Image src="/images/logo.png" alt="KeyHome" width={56} height={56} priority />
      </Box>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          color: 'text.primary',
          animation: 'logoutSlideUp 0.5s ease-out 0.4s both',
          '@keyframes logoutSlideUp': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        À bientôt !
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mt: 0.5,
          animation: 'logoutSlideUp 0.5s ease-out 0.65s both',
        }}
      >
        Déconnexion en cours...
      </Typography>
    </Box>
  );
}
