'use client';

import ButtonSpinner from '@/components/ui/feedback/ButtonSpinner';
import { Button as MuiButton, type ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  gradient as gradientTokens,
  brandAgent,
  radius,
  shadow,
  transition,
} from '../../../theme/tokens';

type GradientVariant = 'primary' | 'agent';

export interface GradientButtonProps extends Omit<
  ButtonProps,
  'variant' | 'color'
> {
  /** "primary" = pink brand gradient  |  "agent" = teal owner gradient */
  gradientVariant?: GradientVariant;
  /** Show a loading spinner and disable interaction */
  loading?: boolean;
}

const agentGradient = `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`;
const agentGradientHover = `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`;

const StyledButton = styled(MuiButton)<{ $agent?: boolean }>(
  ({ theme, $agent }) => ({
    borderRadius: radius.sm,
    padding: '10px 24px',
    fontSize: '1rem',
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    fontWeight: 700,
    textTransform: 'none',
    color: '#fff',
    border: 'none',
    boxShadow: 'none',
    background: $agent ? agentGradient : gradientTokens.primary,
    transition: `background 0.2s ease, ${transition.spring}`,

    '&:hover:not(:disabled)': {
      background: $agent ? agentGradientHover : gradientTokens.primaryHover,
      boxShadow: $agent ? shadow.agentGlow : shadow.primaryGlow,
      transform: 'translateY(-1px)',
    },

    '&:active': {
      transform: 'scale(0.97)',
    },

    '&:focus-visible': {
      outline: `2px solid ${$agent ? brandAgent.primary : theme.palette.primary.main}`,
      outlineOffset: 2,
      boxShadow: $agent ? shadow.agentFocusRing : shadow.focusRing,
    },

    '&:disabled': {
      opacity: 0.55,
      cursor: 'not-allowed',
      background: $agent ? agentGradient : gradientTokens.primary,
      color: '#fff',
    },

    WebkitFontSmoothing: 'antialiased',
  })
);

/**
 * Atomic gradient CTA button.
 *
 * Replaces all inline `sx={{ background: gradient.primary, '&:hover': { ... } }}` patterns.
 *
 * @example
 * <GradientButton gradientVariant="agent" loading={submitting}>
 *   Publier l'annonce
 * </GradientButton>
 */
export function GradientButton({
  gradientVariant = 'primary',
  loading = false,
  children,
  disabled,
  sx,
  ...props
}: GradientButtonProps) {
  return (
    <StyledButton
      variant="contained"
      disableElevation
      $agent={gradientVariant === 'agent'}
      disabled={disabled || loading}
      sx={sx}
      {...props}
    >
      {loading ? <ButtonSpinner size={20} /> : children}
    </StyledButton>
  );
}
