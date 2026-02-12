'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Grid,
  Pagination,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  Apartment,
  Landscape,
  Villa,
  Store,
  MapsHomeWork,
} from '@mui/icons-material';
import { adsService } from '@/services/ads.service';
import { recommendationsService } from '@/services/users.service';
import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import CategoryPills from '@/components/ui/CategoryPills';
import FadeIn from '@/components/ui/FadeIn';

const categories = [
  { label: 'Tous', value: '', icon: <MapsHomeWork sx={{ fontSize: 18 }} /> },
  { label: 'Maisons', value: 'maison', icon: <HomeIcon sx={{ fontSize: 18 }} /> },
  { label: 'Appartements', value: 'appartement', icon: <Apartment sx={{ fontSize: 18 }} /> },
  { label: 'Terrains', value: 'terrain', icon: <Landscape sx={{ fontSize: 18 }} /> },
  { label: 'Villas', value: 'villa', icon: <Villa sx={{ fontSize: 18 }} /> },
  { label: 'Commerces', value: 'commerce', icon: <Store sx={{ fontSize: 18 }} /> },
];

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: adsData, isLoading, isFetching } = useQuery({
    queryKey: ['ads', page, selectedCategory],
    queryFn: () =>
      adsService.list({
        page,
        per_page: 20,
        type: selectedCategory || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsService.list(),
    staleTime: 5 * 60 * 1000,
  });

  const ads = adsData?.data || [];
  const totalPages = adsData?.meta?.last_page || 1;
  const recommendations = recommendationsData?.data || [];

  const skeletonCount = isMobile ? 4 : 12;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Category pills — centered under navbar */}
      <Container maxWidth="lg" sx={{ pt: 2, pb: 1 }}>
        <CategoryPills
          categories={categories}
          selected={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
        />
      </Container>

      <Container maxWidth="xl" sx={{ mt: 1, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <FadeIn delay={0.1} direction="up">
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} gutterBottom>
              Recommandé pour vous
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1.5, md: 2 },
                overflowX: 'auto',
                pb: 1,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                mx: { xs: -2, sm: 0 },
                px: { xs: 2, sm: 0 },
              }}
            >
              {recommendations.slice(0, 8).map((ad) => (
                <Box
                  key={ad.id}
                  sx={{
                    minWidth: { xs: 220, sm: 260, md: 280 },
                    maxWidth: { xs: 220, sm: 260, md: 280 },
                    flexShrink: 0,
                  }}
                >
                  <AdCard ad={ad} />
                </Box>
              ))}
            </Box>
            <Divider sx={{ mt: { xs: 2, md: 3 } }} />
          </Box>
          </FadeIn>
        )}

        {/* Main grid */}
        <FadeIn delay={0.2} direction="up">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
            {selectedCategory
              ? `${categories.find((c) => c.value === selectedCategory)?.label || selectedCategory}`
              : 'Annonces récentes'}
          </Typography>
          {isFetching && !isLoading && (
            <Typography variant="caption" color="text.secondary">
              Mise à jour...
            </Typography>
          )}
        </Box>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, idx) => (
                <Grid key={idx} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
                  <AdCardSkeleton />
                </Grid>
              ))
            : ads.map((ad, idx) => (
                <Grid key={ad.id} size={{ xs: 6, sm: 6, md: 4, lg: 3 }} sx={{ animation: `fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.03}s both` }}>
                  <AdCard ad={ad} />
                </Grid>
              ))}
        </Grid>
        </FadeIn>

        {/* Empty state */}
        {!isLoading && ads.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <MapsHomeWork sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune annonce trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essayez de modifier vos filtres ou revenez plus tard
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => {
                setPage(val);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              shape="rounded"
              size={isMobile ? 'small' : 'medium'}
              siblingCount={isMobile ? 0 : 1}
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
