'use client';

import { shadow } from '@/theme/tokens';
import { SponsorshipTier } from '@/types';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Box } from '@mui/material';
import { ReactNode } from 'react';

interface BadgeVisual {
  label: string;
  icon: ReactNode;
  bg: string;
}

const VISUALS: Record<Exclude<SponsorshipTier, 'organic'>, BadgeVisual> = {
  premium: {
    label: 'Premium',
    icon: <WorkspacePremiumIcon sx={{ fontSize: 11 }} />,
    bg: 'linear-gradient(135deg, #b8860b 0%, #d4af37 100%)',
  },
  subscription: {
    label: 'Sponsorisé',
    icon: <StarIcon sx={{ fontSize: 11 }} />,
    bg: 'rgba(15, 23, 42, 0.85)',
  },
  manual: {
    label: 'Boosté',
    icon: <TrendingUpIcon sx={{ fontSize: 11 }} />,
    bg: 'rgba(37, 99, 235, 0.92)',
  },
};

interface SponsorshipBadgeProps {
  tier?: SponsorshipTier;
  /**
   * Backwards-compat fallback: a card showing this badge before the API
   * returns the new tier field can still upgrade an `is_boosted` ad to a
   * Manual pill.
   */
  fallbackBoosted?: boolean;
  /** Pixel offset from the top of the parent. */
  top?: number;
  /** Pixel offset from the left of the parent. */
  left?: number;
}

/**
 * Renders a sponsorship pill in the corner of an ad card.
 * Returns null for organic ads (no badge).
 */
export function SponsorshipBadge({
  tier,
  fallbackBoosted,
  top = 8,
  left = 8,
}: SponsorshipBadgeProps) {
  const resolved: Exclude<SponsorshipTier, 'organic'> | null =
    tier && tier !== 'organic' ? tier : fallbackBoosted ? 'manual' : null;

  if (!resolved) {
    return null;
  }

  const visual = VISUALS[resolved];

  return (
    <Box
      aria-label={`Annonce ${visual.label.toLowerCase()}`}
      sx={{
        position: 'absolute',
        top,
        left,
        zIndex: 2,
        px: 1,
        py: 0.25,
        borderRadius: 99,
        background: visual.bg,
        color: 'white',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        boxShadow: shadow.medium,
        backdropFilter: 'blur(4px)',
      }}
    >
      {visual.icon}
      {visual.label}
    </Box>
  );
}
