'use client';

import { Box, type SxProps, type Theme } from '@mui/material';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  sx?: SxProps<Theme>;
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20,
  sx,
}: FadeInProps) {
  const getTransform = () => {
    switch (direction) {
      case 'up': return `translateY(${distance}px)`;
      case 'down': return `translateY(-${distance}px)`;
      case 'left': return `translateX(${distance}px)`;
      case 'right': return `translateX(-${distance}px)`;
      case 'none': return 'none';
    }
  };

  return (
    <Box
      sx={{
        animation: `fadeInCustom ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
        '@keyframes fadeInCustom': {
          '0%': {
            opacity: 0,
            transform: getTransform(),
          },
          '100%': {
            opacity: 1,
            transform: 'translate(0)',
          },
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
