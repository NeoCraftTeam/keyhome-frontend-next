'use client';

import {
  type TrustScoreTier,
  type TrustScorePublic,
  TRUST_SCORE_TIERS,
} from '@/types/trust-score';
import ShieldIcon from '@mui/icons-material/VerifiedUser';
import { Box, Chip, Popover, Typography } from '@mui/material';
import { useCallback, useState } from 'react';

interface TrustScoreBadgeProps {
  trustScore: TrustScorePublic | null | undefined;
  size?: 'small' | 'medium';
}

const tierIcon: Record<TrustScoreTier, string> = {
  non_verifie: '',
  bronze: '',
  argent: '',
  or: '',
  platine: '',
};

const tierEmoji: Record<TrustScoreTier, string> = {
  non_verifie: '-',
  bronze: 'B',
  argent: 'A',
  or: 'O',
  platine: 'P',
};

export default function TrustScoreBadge({
  trustScore,
  size = 'small',
}: TrustScoreBadgeProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  if (!trustScore) {
    return null;
  }

  const tierConfig =
    TRUST_SCORE_TIERS[trustScore.tier] ?? TRUST_SCORE_TIERS.non_verifie;
  const _icon = tierIcon[trustScore.tier] ?? '';
  const badge = tierEmoji[trustScore.tier] ?? '';

  return (
    <>
      <Chip
        icon={<ShieldIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />}
        label={
          size === 'small'
            ? `${tierConfig.label}`
            : `${badge} ${tierConfig.label} (${trustScore.score})`
        }
        size={size}
        onClick={handleClick}
        sx={{
          bgcolor: `${tierConfig.color}15`,
          color: tierConfig.color,
          borderColor: `${tierConfig.color}40`,
          border: '1px solid',
          fontWeight: 600,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: `${tierConfig.color}25`,
          },
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: { p: 2, maxWidth: 280, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{ color: tierConfig.color, fontWeight: 700 }}
          >
            {trustScore.score}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              /100
            </Typography>
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ color: tierConfig.color, mt: 0.5 }}
          >
            {tierConfig.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', mt: 1, display: 'block' }}
          >
            Score de confiance KeyHome
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
