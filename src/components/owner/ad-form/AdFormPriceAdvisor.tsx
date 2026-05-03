'use client';

import { ownerService } from '@/services/owner.service';
import {
  AutoAwesome as AiIcon,
  TrendingDown as LowIcon,
  TrendingFlat as OkIcon,
  TrendingUp as HighIcon,
} from '@mui/icons-material';
import { Alert, Box, Chip, Paper, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { AdFormValues } from './types';
import { sectionSx } from './types';

interface AdFormPriceAdvisorProps {
  values: AdFormValues;
  cityId: string | undefined;
}

function formatPrice(n: number): string {
  return n.toLocaleString('fr-FR');
}

export default function AdFormPriceAdvisor({
  values,
  cityId,
}: AdFormPriceAdvisorProps) {
  const surface = parseInt(values.surface_area, 10);
  const price = parseFloat(values.price);
  const bedrooms = parseInt(values.bedrooms, 10);
  const canEstimate = !!cityId && !!values.type_id && surface > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['rent-estimate', cityId, values.type_id, surface, bedrooms || 0],
    queryFn: () =>
      ownerService.getRentEstimate({
        city_id: cityId!,
        type_id: values.type_id,
        surface,
        bedrooms: bedrooms > 0 ? bedrooms : undefined,
      }),
    enabled: canEstimate,
    staleTime: 60_000,
    retry: false,
  });

  if (!canEstimate) return null;
  if (error) return null;

  const hasPrice = !isNaN(price) && price > 0;
  const hasEstimate = data && !('error' in data);

  let status: 'good' | 'high' | 'low' | null = null;
  let pctDiff = 0;
  if (hasPrice && hasEstimate) {
    pctDiff = ((price - data.estimated_median) / data.estimated_median) * 100;
    if (Math.abs(pctDiff) <= 15) {
      status = 'good';
    } else if (pctDiff > 15) {
      status = 'high';
    } else {
      status = 'low';
    }
  }

  const statusConfig = {
    good: {
      color: 'success' as const,
      icon: <OkIcon fontSize="small" />,
      label: 'Dans la moyenne',
    },
    high: {
      color: 'warning' as const,
      icon: <HighIcon fontSize="small" />,
      label: `${Math.round(pctDiff)}% au-dessus`,
    },
    low: {
      color: 'info' as const,
      icon: <LowIcon fontSize="small" />,
      label: `${Math.round(Math.abs(pctDiff))}% en-dessous`,
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...sectionSx,
        border: '2px solid',
        borderColor: 'primary.light',
        bgcolor: 'primary.50',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <AiIcon sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
          Conseiller prix IA
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="rounded" width={120} height={36} />
          <Skeleton variant="text" width={200} />
        </Box>
      ) : hasEstimate ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Prix du marché pour {surface} m² :{' '}
            <Typography component="span" fontWeight={700}>
              {formatPrice(data.estimated_min)} –{' '}
              {formatPrice(data.estimated_max)} FCFA
            </Typography>{' '}
            (médian : {formatPrice(data.estimated_median)} FCFA)
          </Typography>

          {data.sample_count < 5 && (
            <Typography variant="caption" color="text.disabled">
              Basé sur {data.sample_count} annonce
              {data.sample_count > 1 ? 's' : ''} — estimation approximative
            </Typography>
          )}

          {data.type_scope_matched === false && (
            <Typography variant="caption" color="warning.main" display="block">
              Peu d&apos;annonces pour ce type : la fourchette repose sur toutes
              les locations de la ville.
            </Typography>
          )}

          {status && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
            >
              <Typography variant="body2">Votre prix :</Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatPrice(price)} FCFA
              </Typography>
              <Chip
                icon={statusConfig[status].icon}
                label={statusConfig[status].label}
                color={statusConfig[status].color}
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          {!hasPrice && (
            <Alert severity="info" variant="outlined" sx={{ mt: 0.5 }}>
              Entrez un prix pour le comparer au marché.
            </Alert>
          )}
        </Box>
      ) : (
        data &&
        'error' in data && (
          <Typography variant="body2" color="text.secondary">
            {(data as { error: string }).error}
          </Typography>
        )
      )}
    </Paper>
  );
}
