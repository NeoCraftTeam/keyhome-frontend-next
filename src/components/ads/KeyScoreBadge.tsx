'use client';

import { keyScoreService } from '@/services/estimator.service';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Info from '@mui/icons-material/Info';
import {
  Box,
  CircularProgress,
  Divider,
  LinearProgress,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
  adId: string;
  size?: 'small' | 'medium';
}

const SCORE_COLOR = (score: number): string => {
  if (score >= 85) {
    return '#22c55e';
  }
  if (score >= 70) {
    return '#84cc16';
  }
  if (score >= 55) {
    return '#f59e0b';
  }
  if (score >= 40) {
    return '#f97316';
  }
  return '#ef4444';
};

export default function KeyScoreBadge({ adId, size = 'medium' }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['keyscore', adId],
    queryFn: () => keyScoreService.get(adId),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (!data) {
    return null;
  }

  const color = SCORE_COLOR(data.score);
  const isSmall = size === 'small';

  return (
    <>
      <Tooltip title="KeyScore — Qualité de l'annonce">
        <Box
          onClick={(e) => setAnchorEl(e.currentTarget)}
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
          }}
        >
          <EmojiEvents sx={{ fontSize: isSmall ? 14 : 18, color }} />
          <Typography
            variant={isSmall ? 'caption' : 'body2'}
            fontWeight={700}
            sx={{ color }}
          >
            {data.score}
          </Typography>
          {!isSmall && (
            <Typography variant="caption" sx={{ color, opacity: 0.8 }}>
              {data.label}
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
        PaperProps={{ sx: { p: 2.5, width: 280, borderRadius: 2 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEvents sx={{ color, fontSize: 28 }} />
          <Box>
            <Typography fontWeight={700} fontSize={22} sx={{ color }}>
              {data.score}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                /100
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.label}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {Object.values(data.breakdown).map((item) => (
          <Box key={item.label} mb={1.5}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.25,
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(item.score / item.max) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: SCORE_COLOR((item.score / item.max) * 100),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        ))}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
          <Info sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            Score calculé sur la qualité, le prix et la popularité.
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
