'use client';

import { Box, type SxProps, type Theme } from '@mui/material';

interface GradientTextProps {
  children: React.ReactNode;
  /** 'customer' = red–pink | 'owner' = teal–sky | 'gold' = teal–gold */
  variant?: 'customer' | 'owner' | 'gold';
  component?: React.ElementType;
  sx?: SxProps<Theme>;
}

const GRADIENTS = {
  customer: 'linear-gradient(135deg, #F6475F 0%, #FF8C94 100%)',
  owner: 'linear-gradient(135deg, #0D9488 0%, #0EA5E9 100%)',
  gold: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)',
} as const;

/**
 * Renders its children as gradient-clipped text.
 *
 * Usage:
 *   <GradientText variant="owner">KeyHome Business</GradientText>
 *   <GradientText variant="customer" component="span">maison idéale</GradientText>
 */
export default function GradientText({
  children,
  variant = 'customer',
  component = 'span',
  sx,
}: GradientTextProps) {
  return (
    <Box
      component={component}
      sx={{
        background: GRADIENTS[variant],
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
