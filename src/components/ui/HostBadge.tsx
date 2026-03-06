'use client';

import { VerifiedUser } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';

interface HostBadgeProps {
  /** Overrides the default "Propriétaire Vérifié" label */
  label?: string;
  /** 'gold' = owner verified, 'indigo' = agency verified */
  variant?: 'gold' | 'indigo';
  size?: 'small' | 'medium';
}

const VARIANTS = {
  gold: {
    bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
    border: 'rgba(251, 191, 36, 0.3)',
    color: '#B45309',
    darkColor: '#FCD34D',
    iconColor: '#F59E0B',
    tooltip: 'Ce propriétaire a vérifié son identité via KeyHome',
  },
  indigo: {
    bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(79, 70, 229, 0.08) 100%)',
    border: 'rgba(99, 102, 241, 0.3)',
    color: '#4338CA',
    darkColor: '#A5B4FC',
    iconColor: '#6366F1',
    tooltip: 'Agence immobilière vérifiée par KeyHome',
  },
};

/**
 * HostBadge — trust signal pill for verified owners/agencies.
 *
 * Usage:
 *   <HostBadge />                         // gold "Propriétaire Vérifié"
 *   <HostBadge variant="indigo" label="Agence Vérifiée" />
 */
export default function HostBadge({
  label,
  variant = 'gold',
  size = 'small',
}: HostBadgeProps) {
  const v = VARIANTS[variant];
  const isSmall = size === 'small';
  const displayLabel = label ?? (variant === 'gold' ? 'Propriétaire Vérifié' : 'Agence Vérifiée');

  return (
    <Tooltip title={v.tooltip} arrow>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: isSmall ? 1 : 1.5,
          py: isSmall ? 0.35 : 0.6,
          borderRadius: '20px',
          background: v.bg,
          border: `1px solid ${v.border}`,
          cursor: 'default',
          userSelect: 'none',
          transition: 'opacity 0.2s',
          '&:hover': { opacity: 0.85 },
        }}
      >
        <VerifiedUser
          sx={{
            fontSize: isSmall ? 12 : 14,
            color: v.iconColor,
          }}
        />
        <Typography
          component="span"
          sx={{
            fontSize: isSmall ? '0.68rem' : '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: v.color,
            '.dark &': { color: v.darkColor },
          }}
        >
          {displayLabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}
