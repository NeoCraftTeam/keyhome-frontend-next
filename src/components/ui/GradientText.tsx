'use client';

import { Box, type SxProps, type Theme } from '@mui/material';
import { brand, gradient } from '@/theme/tokens';

interface GradientTextProps {
  children: React.ReactNode;
  /** 'customer' = red–pink | 'owner' = teal–sky | 'gold' = teal–gold */
  variant?: 'customer' | 'owner' | 'gold';
  component?: React.ElementType;
  sx?: SxProps<Theme>;
}

const GRADIENTS = {
  customer: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryLight} 100%)`,
  owner: gradient.agent,
  gold: gradient.agentGold,
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
