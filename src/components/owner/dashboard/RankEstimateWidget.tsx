'use client';

import { adsService } from '@/services/ads.service';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface Props {
  adId: string;
  adTitle?: string;
}

export default function RankEstimateWidget({ adId, adTitle }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['rank-estimate', adId],
    queryFn: () => adsService.getRankEstimate(adId),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (isError) return null;

  const rank = data?.rank ?? null;
  const total = data?.total_in_market ?? 0;
  const percentile = data?.percentile ?? null;
  const segment = data?.segment;
  const message = data?.message;

  const rankColor =
    percentile === null
      ? 'text.secondary'
      : percentile >= 80
        ? 'success.main'
        : percentile >= 50
          ? 'warning.main'
          : 'error.main';

  const rankLabel =
    percentile === null
      ? '—'
      : percentile >= 80
        ? 'Excellent'
        : percentile >= 50
          ? 'Bon'
          : 'À améliorer';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LeaderboardIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Classement estimé
          </Typography>
        </Box>

        {adTitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            title={adTitle}
            sx={{ mb: 2 }}
          >
            {adTitle}
          </Typography>
        )}

        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}

        {!message && (
          <>
            {isLoading ? (
              <Skeleton variant="text" width={120} height={48} />
            ) : rank !== null ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h3" fontWeight={800} color={rankColor}>
                  #{rank}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  sur {total}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h3" fontWeight={800} color="text.disabled">
                —
              </Typography>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              {percentile !== null && (
                <Tooltip
                  title={`Votre annonce est dans le top ${100 - percentile + 1}% du marché`}
                  placement="top"
                >
                  <Chip
                    icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
                    label={rankLabel}
                    size="small"
                    sx={{
                      bgcolor:
                        percentile >= 80
                          ? 'success.light'
                          : percentile >= 50
                            ? 'warning.light'
                            : 'error.light',
                      color:
                        percentile >= 80
                          ? 'success.dark'
                          : percentile >= 50
                            ? 'warning.dark'
                            : 'error.dark',
                      fontWeight: 600,
                    }}
                  />
                </Tooltip>
              )}
              {segment?.city && (
                <Typography variant="caption" color="text.secondary">
                  {[segment.type, segment.city].filter(Boolean).join(' · ')}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
