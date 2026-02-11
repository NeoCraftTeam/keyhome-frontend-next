'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';

export default function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <Box
        sx={{
          animation: 'pulseScale 1.2s ease-in-out infinite',
          '@keyframes pulseScale': {
            '0%, 100%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.1)', opacity: 0.7 },
          },
        }}
      >
        <Image
          src="/images/logo.png"
          alt="KeyHome"
          width={56}
          height={56}
          priority
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          animation: 'fadeInUp 0.5s ease 0.3s both',
          '@keyframes fadeInUp': {
            '0%': { opacity: 0, transform: 'translateY(8px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Chargement
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            gap: '3px',
            alignItems: 'center',
            '& span': {
              width: 4,
              height: 4,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'dotBounce 1.2s ease-in-out infinite',
            },
            '& span:nth-of-type(2)': { animationDelay: '0.2s' },
            '& span:nth-of-type(3)': { animationDelay: '0.4s' },
            '@keyframes dotBounce': {
              '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
              '40%': { opacity: 1, transform: 'scale(1.2)' },
            },
          }}
        >
          <span />
          <span />
          <span />
        </Box>
      </Box>
    </Box>
  );
}
