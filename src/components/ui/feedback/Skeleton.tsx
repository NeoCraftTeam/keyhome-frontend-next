'use client';

import { Skeleton as MuiSkeleton, SkeletonProps } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { radius } from '../../../theme/tokens';

/**
 * Enterprise Grade Skeleton Component.
 * Standardizes loading states to eliminate Layout Shift (CLS).
 * Uses standard radii (radius.sm = 8px) for consistency.
 */
const StyledSkeleton = styled(MuiSkeleton)<SkeletonProps>(({
  theme,
  variant,
}) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    borderRadius: variant === 'circular' ? '50%' : radius.sm,
    backgroundColor: isDarkMode
      ? alpha(theme.palette.text.primary, 0.05)
      : alpha(theme.palette.text.primary, 0.04),

    // Smooth animation
    animationDuration: '1.5s',

    '&::after': {
      background: `linear-gradient(90deg, transparent, ${
        isDarkMode
          ? alpha(theme.palette.text.primary, 0.08)
          : alpha(theme.palette.text.primary, 0.06)
      }, transparent)`,
    },
  };
});

export const Skeleton = (props: SkeletonProps) => {
  return <StyledSkeleton {...props} />;
};
