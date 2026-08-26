'use client';

import { adsService } from '@/services/ads.service';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Info from '@mui/icons-material/Info';
import {
  Box,
  Divider,
  LinearProgress,
  Popover,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
  adId: string;
  size?: 'small' | 'medium';
}

/** Canonical KeyScore scale — shared with the KeyScore card + feed badge. */
const SCORE_COLOR = (score: number): string => {
  if (score >= 75) {
    return '#16a34a';
  }
  if (score >= 50) {
    return '#ca8a04';
  }
  if (score >= 25) {
    return '#ea580c';
  }
  return '#dc2626';
};

const SCORE_LABEL = (score: number): string => {
  if (score >= 75) {
    return 'Excellent';
  }
  if (score >= 50) {
    return 'Bon quartier';
  }
  if (score >= 25) {
    return 'Correct';
  }
  return 'Émergent';
};

/**
 * KeyScore — the real neighborhood livability score (0–100) computed from
 * OpenStreetMap data (transports, commerces, santé, éducation, sécurité, vie
 * de quartier). Shares its query with the KeyScore card on the detail page,
 * so it costs no extra request.
 */
export default function KeyScoreBadge({ adId, size = 'medium' }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isSmall = size === 'small';

  const { data, isLoading } = useQuery({
    queryKey: ['neighborhood-scorecard', adId, 0],
    queryFn: () => adsService.getNeighborhoodScorecard(adId, false),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const scorecard = data?.data ?? null;

  if (isLoading) {
    // Reserve the pill footprint so the chip row doesn't reflow on land.
    return (
      <Skeleton
        variant="rounded"
        width={isSmall ? 60 : 120}
        height={isSmall ? 22 : 30}
        sx={{ borderRadius: 99 }}
      />
    );
  }

  if (!scorecard || scorecard.status === 'unavailable') {
    return null;
  }

  const score = scorecard.global_score;
  const color = SCORE_COLOR(score);
  const categories = Object.values(scorecard.categories);

  return (
    <>
      <Tooltip title="KeyScore — qualité du quartier (données OpenStreetMap)">
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAnchorEl(e.currentTarget);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`KeyScore ${score} sur 100 — voir le détail du quartier`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: isSmall ? 1 : 1.5,
            py: isSmall ? 0.25 : 0.5,
            borderRadius: 99,
            bgcolor: `${color}20`,
            border: `1.5px solid ${color}`,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: `${color}30` },
            '&:focus-visible': {
              outline: `2px solid ${color}`,
              outlineOffset: 2,
            },
          }}
        >
          <EmojiEvents sx={{ fontSize: isSmall ? 14 : 18, color }} />
          <Typography
            variant={isSmall ? 'caption' : 'body2'}
            fontWeight={700}
            sx={{ color }}
          >
            {score}
          </Typography>
          {!isSmall && (
            <Typography variant="caption" sx={{ color, opacity: 0.8 }}>
              {SCORE_LABEL(score)}
            </Typography>
          )}
        </Box>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 300, borderRadius: 2 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEvents sx={{ color, fontSize: 28 }} />
          <Box>
            <Typography fontWeight={700} fontSize={22} sx={{ color }}>
              {score}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                /100
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {SCORE_LABEL(score)} · qualité du quartier
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {categories.map((cat) => (
          <Box key={cat.label} mb={1.5}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.25,
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                {cat.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cat.poi_count} à proximité
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={cat.score}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: SCORE_COLOR(cat.score),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        ))}

        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 2 }}
        >
          <Info sx={{ fontSize: 14, color: 'text.disabled', mt: 0.1 }} />
          <Typography variant="caption" color="text.disabled">
            Commerces, transports, santé, écoles et services réellement présents
            autour du bien (OpenStreetMap).
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
