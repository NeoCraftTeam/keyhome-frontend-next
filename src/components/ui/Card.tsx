'use client';

import { Card as MuiCard, CardProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { radius, transition } from '../../theme/tokens';

/**
 * Enterprise Grade Card Component.
 * Implements standard radii (radius.md = 12px), subtle shadows,
 * and smooth hover transitions (transition.base).
 */
const StyledCard = styled(MuiCard)<CardProps>(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    borderRadius: radius.md,
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    transition: transition.base,
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'none',
    overflow: 'hidden',

    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: isDarkMode
        ? '0 8px 32px rgba(0,0,0,0.4)'
        : '0 8px 32px rgba(0,0,0,0.06)',
      borderColor: isDarkMode
        ? theme.palette.primary.main
        : theme.palette.divider,
    },

    // Smooth rendering for transform
    willChange: 'transform, box-shadow',
  };
});

export const Card = (props: CardProps) => {
  return <StyledCard {...props} />;
};
