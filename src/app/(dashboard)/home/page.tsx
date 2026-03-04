'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import CategoryPills from '@/components/ui/CategoryPills';
import FadeIn from '@/components/ui/FadeIn';
import AppTour from '@/components/ui/AppTour';
import SurveyPrompt from '@/components/surveys/SurveyPrompt';
import { adsService } from '@/services/ads.service';
import { recommendationsService } from '@/services/users.service';
import {
    Apartment,
    Home as HomeIcon,
    Landscape,
    MapsHomeWork,
    Store,
    Villa,
} from '@mui/icons-material';
import {
    Box,
    Container,
    Divider,
    Grid,
    Pagination,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState, useTransition } from 'react';

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
  const gridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch recommendations first so we can exclude their IDs from the main listing
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsService.list(),
    staleTime: 5 * 60 * 1000,
  });

  const recommendations = recommendationsData?.data || [];
  // Stable array — avoids query key churn when recommendations haven't changed
  const recommendedIds = useMemo(
    () => (recommendationsData?.data ?? []).map((r) => Number(r.id)),
    [recommendationsData],
  );

  const { data: adsData, isLoading, isFetching } = useQuery({
    queryKey: ['ads', page, selectedCategory, recommendedIds],
    queryFn: () =>
      adsService.list({
        page,
        per_page: 20,
        type: selectedCategory || undefined,
        exclude_ids: recommendedIds.length > 0 ? recommendedIds : undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const ads = adsData?.data || [];
  const totalPages = adsData?.meta?.last_page || 1;

  const skeletonCount = isMobile ? 4 : 12;

  // Show shimmer when switching categories (isFetching but no cached data for this key)
  const showShimmer = isLoading || (isFetching && ads.length === 0) || isPending;

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      setSelectedCategory(val);
      setPage(1);
    });
  };

  const handlePageChange = (_: unknown, val: number) => {
    setPage(val);
    // Scroll to the listing grid, not the top of the page
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <AppTour />
      <SurveyPrompt
        surveyId="experience-utilisateur-2026"
        title="Votre avis compte !"
        description="Aidez-nous à améliorer KeyHome en répondant à quelques questions sur votre expérience."
      />
      {/* Category pills — centered under navbar */}
      <Box 
        sx={{ 
          position: 'sticky', 
          top: 64, 
          zIndex: 10, 
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="lg">
          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onChange={handleCategoryChange}
          />
        </Container>
      </Box>

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
        <Box
          ref={gridRef}
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2, scrollMarginTop: '80px' }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
            {selectedCategory
              ? `${categories.find((c) => c.value === selectedCategory)?.label || selectedCategory}`
              : 'Annonces récentes'}
          </Typography>
          {isFetching && !showShimmer && (
            <Typography variant="caption" color="text.secondary">
              Mise à jour...
            </Typography>
          )}
        </Box>

        <Grid container spacing={{ xs: 2, sm: 2, md: 2.5 }}>
          {showShimmer
            ? Array.from({ length: skeletonCount }).map((_, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <AdCardSkeleton />
                </Grid>
              ))
            : ads.map((ad, idx) => (
                <Grid key={ad.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }} sx={{ animation: `fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.03}s both` }}>
                  <AdCard ad={ad} />
                </Grid>
              ))}
        </Grid>
        </FadeIn>

        {/* Empty state */}
        {!showShimmer && ads.length === 0 && (
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
              onChange={handlePageChange}
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
