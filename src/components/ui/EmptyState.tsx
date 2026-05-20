'use client';

import { Inbox as InboxIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import NextLink from 'next/link';
import { brand, brandAgent, shadow as shadowTokens } from '@/theme/tokens';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant:
   * - 'default' — grey muted icon (original)
   * - 'owner'   — teal gradient icon + float animation
   * - 'customer'— red gradient icon + float animation
   */
  variant?: 'default' | 'owner' | 'customer';
}

const SIZE_CONFIG = {
  sm: { py: 3, iconBox: 44, iconFontSize: 22 },
  md: { py: 6, iconBox: 64, iconFontSize: 30 },
  lg: { py: 10, iconBox: 80, iconFontSize: 38 },
} as const;

const VARIANT_STYLES = {
  default: {
    background: undefined,
    color: 'text.disabled' as const,
    float: false,
    shadow: 'none',
  },
  owner: {
    background: brandAgent.primary,
    color: '#fff',
    float: true,
    shadow: shadowTokens.agentGlow,
  },
  customer: {
    background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryLight} 100%)`,
    color: '#fff',
    float: true,
    shadow: shadowTokens.primaryGlow,
  },
} as const;

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  variant = 'default',
}: EmptyStateProps) {
  const { py, iconBox, iconFontSize } = SIZE_CONFIG[size];
  const vStyle = VARIANT_STYLES[variant];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py,
        px: 3,
        gap: 2.5,
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          width: iconBox,
          height: iconBox,
          borderRadius: variant === 'default' ? '50%' : 3,
          background: vStyle.background,
          bgcolor: vStyle.background
            ? undefined
            : (theme) =>
                theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: vStyle.color,
          flexShrink: 0,
          boxShadow: vStyle.shadow,
          // Float animation for branded variants
          ...(vStyle.float && {
            animation: 'float 5s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-8px)' },
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          }),
        }}
      >
        {icon ?? <InboxIcon sx={{ fontSize: iconFontSize }} />}
      </Box>

      {/* Text */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          maxWidth: 320,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ lineHeight: 1.3 }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* CTA */}
      {action &&
        (action.href ? (
          <Button
            component={NextLink}
            href={action.href}
            variant="contained"
            color={variant === 'owner' ? 'primary' : undefined}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              mt: 0.5,
              ...(variant === 'owner' && { boxShadow: 'none' }),
            }}
          >
            {action.label}
          </Button>
        ) : (
          <Button
            variant="contained"
            color={variant === 'owner' ? 'primary' : undefined}
            onClick={action.onClick}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              mt: 0.5,
              ...(variant === 'owner' && { boxShadow: 'none' }),
            }}
          >
            {action.label}
          </Button>
        ))}
    </Box>
  );
}

export default EmptyState;
