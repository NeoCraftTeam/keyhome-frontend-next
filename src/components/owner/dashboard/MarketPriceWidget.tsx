'use client';

import { ownerAnalyticsService } from '@/services/owner/owner-analytics.service';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface Props {
  adId: string;
  adTitle: string;
  adPrice: number;
  cityId: string;
  typeId: string;
  surface: number;
  bedrooms?: number;
}

function formatFCFA(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k`;
  return String(v);
}

export default function MarketPriceWidget({
  adPrice,
  adTitle,
  cityId,
  typeId,
  surface,
  bedrooms,
}: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['rent-estimate', cityId, typeId, surface, bedrooms],
    queryFn: () =>
      ownerAnalyticsService.getRentEstimate({
        city_id: cityId,
        type_id: typeId,
        surface,
        bedrooms,
      }),
    staleTime: 10 * 60_000,
    enabled: Boolean(cityId && typeId && surface),
  });

  if (!cityId || !typeId || !surface) return null;

  const median = data?.estimated_median ?? 0;
  const pctDiff =
    median > 0 ? Math.round(((adPrice - median) / median) * 100) : 0;
  const isAbove = pctDiff > 5;
  const isBelow = pctDiff < -5;

  const Icon = isAbove
    ? TrendingUpIcon
    : isBelow
      ? TrendingDownIcon
      : TrendingFlatIcon;
  const color = isAbove
    ? 'error.main'
    : isBelow
      ? 'success.main'
      : 'text.secondary';
  const label = isAbove
    ? `${pctDiff}% au-dessus du marché`
    : isBelow
      ? `${Math.abs(pctDiff)}% en-dessous du marché`
      : 'Dans la fourchette du marché';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        // Match RankEstimateWidget so the paired dashboard widgets align
        // at the same height in their 2-column grid.
        height: '100%',
      }}
    >
      <CardContent
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          minWidth: 200,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Prix vs marché
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ maxWidth: 200 }}
        >
          {adTitle}
        </Typography>

        {isLoading ? (
          <Skeleton variant="text" width={120} height={28} />
        ) : isError || !data || data.error ? (
          <Typography variant="caption" color="text.disabled">
            Données insuffisantes
          </Typography>
        ) : (
          <>
            <Tooltip
              title={`Médiane estimée : ${formatFCFA(median)} FCFA · Min ${formatFCFA(data.estimated_min)} · Max ${formatFCFA(data.estimated_max)} (${data.sample_count} annonces)`}
              placement="top"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  cursor: 'help',
                }}
              >
                <Icon sx={{ fontSize: 20, color }} />
                <Typography variant="body2" fontWeight={700} color={color}>
                  {label}
                </Typography>
              </Box>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              Votre prix : <strong>{formatFCFA(adPrice)} FCFA</strong> · Médiane
              : <strong>{formatFCFA(median)} FCFA</strong>
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
}
