'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import HeroSearch from '@/components/ads/HeroSearch';
import AppTour from '@/components/ui/AppTour';
import FadeIn from '@/components/ui/FadeIn';
import QueryError from '@/components/ui/QueryError';
import { useAuth } from '@/providers/AuthProvider';
import { adsService } from '@/services/ads.service';
import { citiesService } from '@/services/cities.service';
import { recommendationsService } from '@/services/users.service';
import { City } from '@/types';
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
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogContent,
    Divider,
    Grid,
    Pagination,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';

const CATEGORIES = [
  { label: 'Tous', value: '', icon: <MapsHomeWork sx={{ fontSize: 16 }} /> },
  { label: 'Maisons', value: 'maison', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
  { label: 'Appartements', value: 'appartement', icon: <Apartment sx={{ fontSize: 16 }} /> },
  { label: 'Terrains', value: 'terrain', icon: <Landscape sx={{ fontSize: 16 }} /> },
  { label: 'Villas', value: 'villa', icon: <Villa sx={{ fontSize: 16 }} /> },
  { label: 'Commerces', value: 'commerce', icon: <Store sx={{ fontSize: 16 }} /> },
];

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const gridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Hero search autocomplete state
  const [cityInput, setCityInput] = useState('');
  const [pendingCity, setPendingCity] = useState<City | null>(null);
  const [intentOpen, setIntentOpen] = useState(false);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['hero-cities', cityInput],
    queryFn: () => citiesService.list({ q: cityInput, per_page: 10 }),
    enabled: cityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  const handleCitySelect = (_: React.SyntheticEvent, city: City | null) => {
    if (!city) return;
    setPendingCity(city);
    setIntentOpen(true);
  };

  const handleIntentChoice = (intent: 'louer' | 'acheter' | null) => {
    setIntentOpen(false);
    if (!pendingCity) return;
    const params = new URLSearchParams({ city: pendingCity.name });
    if (intent) params.set('intent', intent);
    router.push(`/search?${params.toString()}`);
    setCityInput('');
    setPendingCity(null);
  };

  // Recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsService.list(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const recommendations = recommendationsData?.data || [];
  const recommendedIds = useMemo(
    () => (recommendationsData?.data ?? []).map((r) => String(r.id)),
    [recommendationsData],
  );

  const { data: adsData, isLoading, isFetching, isError, refetch } = useQuery({
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
  const showShimmer = isLoading || (isFetching && ads.length === 0) || isPending;

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      setSelectedCategory(val);
      setPage(1);
    });
  };

  const handlePageChange = (_: unknown, val: number) => {
    setPage(val);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box sx={{ pb: { xs: 12, sm: 6 } }}>
      <AppTour />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 340, sm: 400, md: 480 },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          py: { xs: 4, sm: 0 },
        }}
      >
        {/* Background */}
        <Box
          component="img"
          src="/images/maison-blanche.webp"
          alt="Hero"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 60%',
          }}
        />
        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.12) 100%)',
          }}
        />

        {/* Content — left-aligned like Zillow */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 3, sm: 5, md: 8 },
            maxWidth: 640,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.6rem' },
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: -1,
              mb: { xs: 2.5, md: 3 },
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}
          >
            Acheter.{'\u00a0'}Louer.{'\u00a0'}Vendre.
          </Typography>

          {/* Search — tabs: by city OR natural language */}
          <HeroSearch
            cities={cities}
            cityInput={cityInput}
            setCityInput={setCityInput}
            isCitiesLoading={isCitiesLoading}
            onCitySelect={handleCitySelect}
          />
        </Box>
      </Box>

      {/* ── Intent dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={intentOpen}
        onClose={() => setIntentOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: { xs: 2, sm: 4 },
            py: 3,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Illustration */}
          <Box sx={{ fontSize: 64, mb: 1.5 }}>🏠</Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            Que recherchez-vous à{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              {pendingCity?.name}
            </Box>{' '}
            ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sélectionnez votre intention pour affiner les résultats
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handleIntentChoice('acheter')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                borderWidth: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: '#fff' },
              }}
            >
              À acheter
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handleIntentChoice('louer')}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                borderWidth: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: '#fff' },
              }}
            >
              À louer
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => handleIntentChoice(null)}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.9rem',
              }}
            >
              Voir tout
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Category pills ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pt: 2, pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            pb: 0.5,
            justifyContent: { xs: 'flex-start', md: 'center' },
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <Chip
                key={cat.value}
                icon={cat.icon}
                label={cat.label}
                onClick={() => handleCategoryChange(cat.value)}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{
                  flexShrink: 0,
                  fontWeight: isActive ? 700 : 500,
                  ...(isActive
                    ? {
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '& .MuiChip-icon': { color: '#fff' },
                      }
                    : {}),
                }}
              />
            );
          })}
        </Box>
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
          <Box
            ref={gridRef}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              mb: 2,
              scrollMarginTop: '80px',
            }}
          >
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
              {selectedCategory
                ? CATEGORIES.find((c) => c.value === selectedCategory)?.label || selectedCategory
                : 'Annonces récentes'}
            </Typography>
            {isFetching && !showShimmer && (
              <Typography variant="caption" color="text.secondary">
                Mise à jour...
              </Typography>
            )}
          </Box>

          {isError && !showShimmer && (
            <QueryError
              onRetry={() => refetch()}
              message="Impossible de charger les annonces. Vérifiez votre connexion et réessayez."
            />
          )}

          {!isError && (
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
              {showShimmer
                ? Array.from({ length: skeletonCount }).map((_, idx) => (
                    <Grid key={idx} size={{ xs: 6, sm: 6, md: 4, lg: 3 }}>
                      <AdCardSkeleton />
                    </Grid>
                  ))
                : ads.map((ad, idx) => (
                    <Grid
                      key={ad.id}
                      size={{ xs: 6, sm: 6, md: 4, lg: 3 }}
                      sx={{
                        animation: `fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 0.03}s both`,
                      }}
                    >
                      <AdCard ad={ad} />
                    </Grid>
                  ))}
            </Grid>
          )}
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
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
