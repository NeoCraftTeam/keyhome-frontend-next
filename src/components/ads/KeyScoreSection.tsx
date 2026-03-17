'use client';

import { keyScoreService } from '@/services/estimator.service';
import { EmojiEvents, Info } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface Props {
  adId: string;
}

const SCORE_COLOR = (score: number): string => {
  if (score >= 85) { return '#22c55e'; }
  if (score >= 70) { return '#84cc16'; }
  if (score >= 55) { return '#f59e0b'; }
  if (score >= 40) { return '#f97316'; }
  return '#ef4444';
};

const SCORE_BG_LIGHT = (score: number): string => {
  if (score >= 85) { return '#f0fdf4'; }
  if (score >= 70) { return '#f7fee7'; }
  if (score >= 55) { return '#fffbeb'; }
  if (score >= 40) { return '#fff7ed'; }
  return '#fef2f2';
};

const SCORE_BG_DARK = (score: number): string => {
  if (score >= 85) { return 'rgba(34,197,94,0.08)'; }
  if (score >= 70) { return 'rgba(132,204,22,0.08)'; }
  if (score >= 55) { return 'rgba(245,158,11,0.08)'; }
  if (score >= 40) { return 'rgba(249,115,22,0.08)'; }
  return 'rgba(239,68,68,0.08)';
};

const CRITERION_TIPS: Record<string, string> = {
  'Photos': 'Plus il y a de photos de qualité, plus les locataires font confiance à l\'annonce.',
  'Description': 'Une description détaillée rassure et réduit les questions inutiles.',
  'Prix': 'Un prix compétitif par rapport au marché local augmente les contacts.',
  'Localisation': 'Les annonces géolocalisées reçoivent 2× plus de vues.',
  'Équipements': 'Lister les équipements aide les locataires à se projeter.',
  'Popularité': 'Basé sur le ratio vues / interactions.',
  'Fraîcheur': 'Les annonces récentes sont mieux référencées.',
};

const POSITIVE_LABELS: Record<string, string> = {
  'Prix': 'Bon rapport qualité/prix',
  'Localisation': 'Localisation bien définie',
  'Équipements': 'Équipements bien détaillés',
};

export default function KeyScoreSection({ adId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['keyscore', adId],
    queryFn: () => keyScoreService.get(adId),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  if (!data) { return null; }

  const color = SCORE_COLOR(data.score);
  const bg = isDark ? SCORE_BG_DARK(data.score) : SCORE_BG_LIGHT(data.score);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: bg,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
        {/* Score circle */}
        <Box
          sx={{
            width: { xs: 56, sm: 72 },
            height: { xs: 56, sm: 72 },
            borderRadius: '50%',
            border: `4px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'white',
          }}
        >
          <Typography fontWeight={800} fontSize={{ xs: 18, sm: 22 }} sx={{ color, lineHeight: 1 }}>
            {data.score}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={10}>
            /100
          </Typography>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color, fontSize: 20 }} />
            <Typography variant="h6" fontWeight={700}>
              KeyScore™
            </Typography>
          </Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ color }}
          >
            {data.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Score de qualité calculé automatiquement sur 7 critères
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Criteria — sort by score descending to highlight strengths first */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Object.values(data.breakdown)
          .sort((a, b) => (b.score / b.max) - (a.score / a.max))
          .map((item) => {
          const pct = Math.round((item.score / item.max) * 100);
          const itemColor = SCORE_COLOR(pct);
          const tip = CRITERION_TIPS[item.label];
          const displayValue = pct >= 70 && POSITIVE_LABELS[item.label] ? POSITIVE_LABELS[item.label] : item.value;

          return (
            <Box key={item.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {item.label}
                  </Typography>
                  {tip && (
                    <Tooltip title={tip} placement="top">
                      <Info sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {displayValue}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: itemColor, minWidth: 36, textAlign: 'right' }}
                  >
                    {item.score}/{item.max}
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: itemColor,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          mt: 2.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        <Info sx={{ fontSize: 16, color: 'text.disabled', mt: 0.1, flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary">
          Le KeyScore est mis à jour automatiquement. Il aide les locataires à évaluer la qualité d'une annonce en un coup d'œil.
        </Typography>
      </Box>
    </Paper>
  );
}
