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

  const ads: Ad[] = (data?.data ?? []).filter((ad: Ad) => ad.id !== currentAdId).slice(0, 8);

  if (!isLoading && ads.length === 0) { return null; }

  return (
    <Box mt={6}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Annonces similaires
      </Typography>

      {/* Mobile: horizontal scroll */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          gap: 2,
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ minWidth: 260, maxWidth: 260, flexShrink: 0, scrollSnapAlign: 'start' }}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
              </Box>
            ))
          : ads.map((ad) => (
              <Box key={ad.id} sx={{ minWidth: 260, maxWidth: 260, flexShrink: 0, scrollSnapAlign: 'start' }}>
                <AdCard ad={ad} />
              </Box>
            ))}
      </Box>

      {/* Desktop: grid */}
      <Grid container spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ md: 3 }}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : ads.map((ad) => (
              <Grid key={ad.id} size={{ md: 3 }}>
                <AdCard ad={ad} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
