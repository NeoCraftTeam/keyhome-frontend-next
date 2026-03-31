'use client';

import { Button as MuiButton, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { radius, shadow, transition } from '../../theme/tokens';

/**
 * Enterprise Grade Button Component.
 * Implements standard radii (radius.sm = 8px), primaryGlow effects,
 * and spring-like micro-interactions (transition.spring).
 */
const StyledButton = styled(MuiButton)<ButtonProps>(({
  theme,
  variant,
  color,
}) => {
  const isPrimary = color === 'primary' && variant === 'contained';

  return {
    borderRadius: radius.sm,
    padding: '10px 24px',
    fontSize: '0.9375rem',
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    fontWeight: 700,
    textTransform: 'none',
    transition: transition.spring,
    boxShadow: 'none',

    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: isPrimary ? shadow.primaryGlow : 'none',
      backgroundColor: isPrimary ? theme.palette.primary.main : undefined,
    },

    '&:active': {
      transform: 'scale(0.96)',
    },

    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },

    // Ensure smooth text rendering
    WebkitFontSmoothing: 'antialiased',
  };
});

export const Button = (props: ButtonProps) => {
  return <StyledButton {...props} />;
};
