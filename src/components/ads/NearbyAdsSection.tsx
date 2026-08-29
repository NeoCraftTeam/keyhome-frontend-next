'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import FadeIn from '@/components/ui/layout/FadeIn';
import { useUserLocation } from '@/hooks/useUserLocation';
import { adsService } from '@/services/ads.service';

import NearMeIcon from '@mui/icons-material/NearMe';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

/**
 * Default search radius (metres) for the "À proximité" strip. Wide enough to
 * surface a handful of listings in a city while the backend still caps any
 * value at `GeoLocation::MAX_RADIUS` (50 km) server-side.
 */
const DEFAULT_NEARBY_RADIUS_M = 10_000;

interface NearbyAdsSectionProps {
  /** Search radius in metres. Defaults to {@link DEFAULT_NEARBY_RADIUS_M}. */
  radius?: number;
  /** Cap on the number of cards rendered in the horizontal strip. */
  limit?: number;
}

/**
 * Horizontal strip of listings closest to the visitor's current position.
 *
 * Frontend-only: reads the browser geolocation via {@link useUserLocation} and
 * queries `GET /ads/nearby`. The section is deliberately invisible unless it
 * has something useful to show — it renders nothing when geolocation is
 * denied/unavailable or when the query returns no nearby listings, so it never
 * leaves an empty shell on the home page.
 */
export default function NearbyAdsSection({
  radius = DEFAULT_NEARBY_RADIUS_M,
  limit = 8,
}: NearbyAdsSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { location } = useUserLocation();

  // Round the coordinates in the query key so tiny GPS jitter doesn't refetch
  // on every render; ~4 decimals ≈ 11 m of precision, plenty for a city strip.
  const coordKey =
    location !== null
      ? `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`
      : null;

  const { data: ads, isLoading } = useQuery({
    queryKey: ['ads-nearby', coordKey, radius],
    queryFn: () => {
      if (location === null) {
        return [];
      }
      return adsService.nearby({
        latitude: location.latitude,
        longitude: location.longitude,
        radius,
      });
    },
    enabled: location !== null,
    staleTime: 5 * 60 * 1000,
  });

  // Geolocation denied/unavailable — stay out of the way entirely.
  if (location === null) {
    return null;
  }

  // Query resolved with nothing nearby — no empty shell.
  if (!isLoading && (ads === undefined || ads.length === 0)) {
    return null;
  }

  return (
    <FadeIn delay={0.05} direction="up">
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <NearMeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
            À proximité
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            overflowX: 'auto',
            pb: 1,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
            touchAction: 'pan-x pan-y',
          }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    minWidth: { xs: 220, sm: 260, md: 280 },
                    maxWidth: { xs: 220, sm: 260, md: 280 },
                    flexShrink: 0,
                  }}
                >
                  <AdCardSkeleton />
                </Box>
              ))
            : (ads ?? []).slice(0, limit).map((ad) => (
                <Box
                  key={ad.id}
                  sx={{
                    minWidth: { xs: 220, sm: 260, md: 280 },
                    maxWidth: { xs: 220, sm: 260, md: 280 },
                    flexShrink: 0,
                  }}
                >
                  <AdCard
                    ad={ad}
                    imageSizes="(max-width: 600px) 220px, 280px"
                  />
                </Box>
              ))}
        </Box>
      </Box>
    </FadeIn>
  );
}
