'use client';

import AdCard from '@/components/ads/AdCard';
import { adsService } from '@/services/ads.service';
import { Ad } from '@/types';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, Button, Grid, Skeleton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface Props {
  currentAdId: string;
  /** Sidebar variant: vertical list for narrow column (e.g. xl sidebar) */
  variant?: 'default' | 'sidebar';
  /** Hide the title (when parent renders it fixed) */
  hideTitle?: boolean;
  /** Hide context text (when parent renders it, e.g. sidebar) */
  hideContext?: boolean;
}

export default function SimilarAds({
  currentAdId,
  variant = 'default',
  hideTitle = false,
  hideContext = false,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['similar-ads', currentAdId],
    queryFn: () => adsService.getSimilar(currentAdId),
    staleTime: 5 * 60 * 1000,
    enabled: !!currentAdId,
  });

  const ads: Ad[] = (data?.data ?? []).slice(0, 6);

  if (!isLoading && ads.length === 0) {
    return null;
  }

  const isSidebar = variant === 'sidebar';

  return (
    <Box mt={isSidebar ? 0 : 6}>
      {!hideTitle && (
        <Typography
          variant="h5"
          fontWeight={700}
          mb={1}
          sx={{ fontSize: isSidebar ? '1rem' : undefined }}
        >
          Annonces similaires
        </Typography>
      )}
      {!hideContext && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, display: 'block' }}
        >
          D&apos;autres biens correspondant à votre recherche
        </Typography>
      )}

      {/* Sidebar: vertical list */}
      {isSidebar && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={120}
                  sx={{ borderRadius: 2 }}
                />
              ))
            : ads.map((ad) => (
                <Box key={ad.id} sx={{ flexShrink: 0 }}>
                  <AdCard ad={ad} />
                </Box>
              ))}
          <Button
            component={Link}
            href="/search"
            variant="text"
            size="small"
            endIcon={<KeyboardArrowRight />}
            sx={{
              mt: 1,
              textTransform: 'none',
              fontWeight: 600,
              justifyContent: 'flex-start',
            }}
          >
            Voir toutes les annonces similaires
          </Button>
        </Box>
      )}

      {/* Mobile + Desktop (default layout) */}
      {!isSidebar && (
        <>
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
                  <Box
                    key={i}
                    sx={{
                      minWidth: 260,
                      maxWidth: 260,
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <Skeleton
                      variant="rounded"
                      height={280}
                      sx={{ borderRadius: 3 }}
                    />
                  </Box>
                ))
              : ads.map((ad) => (
                  <Box
                    key={ad.id}
                    sx={{
                      minWidth: 260,
                      maxWidth: 260,
                      flexShrink: 0,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <AdCard ad={ad} />
                  </Box>
                ))}
          </Box>

          {/* Desktop: grid */}
          <Grid
            container
            spacing={3}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid key={i} size={{ md: 3 }}>
                    <Skeleton
                      variant="rounded"
                      height={280}
                      sx={{ borderRadius: 3 }}
                    />
                  </Grid>
                ))
              : ads.map((ad) => (
                  <Grid key={ad.id} size={{ md: 3 }}>
                    <AdCard ad={ad} />
                  </Grid>
                ))}
          </Grid>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              component={Link}
              href="/search"
              variant="outlined"
              endIcon={<KeyboardArrowRight />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Voir toutes les annonces similaires
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
