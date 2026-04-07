'use client';

import { trustScoreService } from '@/services/trust-score.service';
import type {
  TrustScoreData,
  TrustScoreBreakdownItem,
} from '@/types/trust-score';
import { TRUST_SCORE_TIERS } from '@/types/trust-score';
import ShieldIcon from '@mui/icons-material/VerifiedUser';
import TipsIcon from '@mui/icons-material/Lightbulb';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface TrustScoreSectionProps {
  userId: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#0D9488';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#64748B';
  if (score >= 20) return '#D97706';
  return '#9CA3AF';
}

function BreakdownRow({ item }: { item: TrustScoreBreakdownItem }) {
  const pct = item.max > 0 ? (item.score / item.max) * 100 : 0;
  const color = getScoreColor(pct);

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {item.label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {item.value}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color }}>
            {item.score}/{item.max}
          </Typography>
        </Box>
      </Box>
      <Tooltip title={item.tip} placement="top" arrow>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: color,
            },
            cursor: 'help',
          }}
        />
      </Tooltip>
    </Box>
  );
}

export default function TrustScoreSection({ userId }: TrustScoreSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trust-score', userId],
    queryFn: () => trustScoreService.get(userId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (
    error ||
    !data ||
    'consent_required' in data ||
    'consent_declined' in data
  ) {
    return null;
  }

  const trustData = data as TrustScoreData;
  const tierConfig =
    TRUST_SCORE_TIERS[trustData.tier] ?? TRUST_SCORE_TIERS.non_verifie;
  const breakdownEntries = Object.values(trustData.breakdown);
  const tips = trustData.tips?.filter(Boolean) ?? [];

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mt: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${tierConfig.color}15`,
            border: `2px solid ${tierConfig.color}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: tierConfig.color }}
          >
            {trustData.score}
          </Typography>
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ShieldIcon sx={{ fontSize: 18, color: tierConfig.color }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Score de confiance
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: tierConfig.color, fontWeight: 600 }}
          >
            {tierConfig.label}
          </Typography>
        </Box>
      </Box>

      {/* Breakdown */}
      <Box sx={{ mb: tips.length > 0 ? 2 : 0 }}>
        {breakdownEntries.map((item, index) => (
          <BreakdownRow key={index} item={item} />
        ))}
      </Box>

      {/* Tips */}
      {tips.length > 0 && (
        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <TipsIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: 'text.secondary' }}
            >
              Conseils pour ameliorer votre score
            </Typography>
          </Box>
          {tips.map((tip, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block' }}
            >
              - {tip}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
}
