'use client';

import AdCard from '@/components/ads/AdCard';
import { recommendationsService } from '@/services/users.service';
import { Ad } from '@/types';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface Props {
  currentAdId: string;
}

export default function SimilarAds({ currentAdId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['similar-ads', currentAdId],
    queryFn: () => recommendationsService.list(),
    staleTime: 5 * 60 * 1000,
  });

  const ads: Ad[] = (data?.data ?? []).filter((ad: Ad) => ad.id !== currentAdId).slice(0, 4);

  if (!isLoading && ads.length === 0) { return null; }

  return (
    <Box mt={6}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Annonces similaires
      </Typography>
      <Grid container spacing={3}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : ads.map((ad) => (
              <Grid key={ad.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <AdCard ad={ad} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
