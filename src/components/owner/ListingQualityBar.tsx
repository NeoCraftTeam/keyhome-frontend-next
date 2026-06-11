'use client';

import type { AdFormValues } from '@/components/owner/ad-form/types';
import { computeListingQuality } from '@/lib/listingQuality';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { Box, LinearProgress, Tooltip, Typography } from '@mui/material';
import { useMemo } from 'react';

interface ListingQualityBarProps {
  values: AdFormValues;
  photosCount: number;
  has3dTour?: boolean;
}

// Map quality buckets to MUI palette tokens so the colour resolves through
// the theme — was hard-coded Tailwind hex which doesn't adapt to dark mode
// and drifts from the rest of the design system (semantic.success/warning/
// error tokens already exist for this purpose).
const SCORE_PALETTE_KEY: Record<'error' | 'warning' | 'success', string> = {
  error: 'error.main',
  warning: 'warning.main',
  success: 'success.main',
};

export default function ListingQualityBar({
  values,
  photosCount,
  has3dTour = false,
}: ListingQualityBarProps) {
  const quality = useMemo(
    () => computeListingQuality(values, photosCount, has3dTour),
    [values, photosCount, has3dTour]
  );

  const color = SCORE_PALETTE_KEY[quality.color];
  const hint = quality.missing[0];
  const isExcellent = quality.score >= 80;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 0.75,
        px: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {isExcellent ? (
        <CheckCircleIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />
      ) : (
        <TipsAndUpdatesIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />
      )}

      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color, flexShrink: 0 }}
      >
        {quality.score}/100
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flexShrink: 0 }}
      >
        · Qualité{' '}
        <Box component="span" sx={{ fontStyle: 'italic' }}>
          {quality.label}
        </Box>
      </Typography>

      <Box sx={{ flex: 1, mx: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={quality.score}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 3,
              transition: 'transform 0.4s ease',
            },
          }}
        />
      </Box>

      {hint && (
        <Tooltip title={hint} arrow placement="top">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              maxWidth: { xs: 100, sm: 200 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'help',
              flexShrink: 1,
            }}
          >
            {hint}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
