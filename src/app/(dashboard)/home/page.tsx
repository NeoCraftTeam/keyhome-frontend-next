'use client';

import AdCard from '@/components/ads/AdCard';
import AdCardSkeleton from '@/components/ads/AdCardSkeleton';
import HeroSearch from '@/components/ads/HeroSearch';
import ClientProfileBanner from '@/components/dashboard/ClientProfileBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import FadeIn from '@/components/ui/FadeIn';
import QueryError from '@/components/ui/QueryError';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import dynamic from 'next/dynamic';
import Image from 'next/image';

import { useGreeting } from '@/hooks/useGreeting';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/providers/AuthProvider';
import { adsService } from '@/services/ads.service';
import { citiesService } from '@/services/cities.service';
import { recommendationsService } from '@/services/users.service';
import { City } from '@/types';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Apartment from '@mui/icons-material/Apartment';
import HomeIcon from '@mui/icons-material/Home';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Landscape from '@mui/icons-material/Landscape';
import MapsHomeWork from '@mui/icons-material/MapsHomeWork';
import SortIcon from '@mui/icons-material/Sort';
import Store from '@mui/icons-material/Store';
import Villa from '@mui/icons-material/Villa';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Fab,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
  Zoom,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

const AppTour = dynamic(() => import('@/components/ui/AppTour'), {
  ssr: false,
});

const CATEGORIES = [
  { label: 'Tous', value: '', icon: <MapsHomeWork sx={{ fontSize: 16 }} /> },
  {
    label: 'Maisons',
    value: 'maison',
    icon: <HomeIcon sx={{ fontSize: 16 }} />,
  },
  {
    label: 'Appartements',
    value: 'appartement',
    icon: <Apartment sx={{ fontSize: 16 }} />,
  },
  {
    label: 'Terrains',
    value: 'terrain',
    icon: <Landscape sx={{ fontSize: 16 }} />,
  },
  { label: 'Villas', value: 'villa', icon: <Villa sx={{ fontSize: 16 }} /> },
  {
    label: 'Commerces',
    value: 'commerce',
    icon: <Store sx={{ fontSize: 16 }} />,
  },
];

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedSort, setFeedSort] = useState<
    'newest' | 'price_asc' | 'price_desc'
  >('newest');
  const [showBackTop, setShowBackTop] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const gridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const { isAuthenticated, user } = useAuth();
  const { items: recentlyViewed } = useRecentlyViewed();
  const greeting = useGreeting();
  const router = useRouter();

  // Hero search autocomplete state
  const [cityInput, setCityInput] = useState('');
  const [debouncedCityInput, setDebouncedCityInput] = useState('');
  const [pendingCity, setPendingCity] = useState<City | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCityInput(cityInput), 300);
    return () => clearTimeout(timer);
  }, [cityInput]);
  const [intentOpen, setIntentOpen] = useState(false);
  const [geolocating, setGeolocating] = useState(false);

  const { data: citiesData, isFetching: isCitiesLoading } = useQuery({
    queryKey: ['hero-cities', debouncedCityInput],
    queryFn: () => citiesService.list({ q: debouncedCityInput, per_page: 10 }),
    enabled: debouncedCityInput.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const cities = citiesData?.data || [];

  const handleCitySelect = useCallback(
    (_: React.SyntheticEvent, city: City | null) => {
      if (!city) return;
      setPendingCity(city);
      // Skip intent dialog if user previously chose an intent
      const savedIntent =
        typeof window !== 'undefined'
          ? (localStorage.getItem('kh:last-intent') as
              | 'louer'
              | 'acheter'
              | null)
          : null;
      if (savedIntent) {
        const params = new URLSearchParams({
          city: city.name,
          intent: savedIntent,
        });
        router.push(`/search?${params.toString()}`);
        setCityInput('');
        setPendingCity(null);
      } else {
        setIntentOpen(true);
      }
    },
    [router]
  );

  const handleIntentChoice = useCallback(
    (intent: 'louer' | 'acheter' | null) => {
      setIntentOpen(false);
      if (!pendingCity) return;
      // Remember intent for next time
      if (intent) {
        try {
          localStorage.setItem('kh:last-intent', intent);
        } catch {}
      }
      const params = new URLSearchParams({ city: pendingCity.name });
      if (intent) params.set('intent', intent);
      router.push(`/search?${params.toString()}`);
      setCityInput('');
      setPendingCity(null);
    },
    [pendingCity, router]
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeolocating(false);
        const params = new URLSearchParams({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          radius: '5',
        });
        const savedIntent =
          typeof window !== 'undefined'
            ? localStorage.getItem('kh:last-intent')
            : null;
        if (savedIntent) params.set('intent', savedIntent);
        router.push(`/search?${params.toString()}`);
      },
      () => setGeolocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [router]);

  // Gap #6: affiche le FAB "retour en haut" après 600px de scroll
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Recommendations
  const { data: recommendationsData, isLoading: isRecommendationsLoading } =
    useQuery({
      queryKey: ['recommendations'],
      queryFn: () => recommendationsService.list(),
      staleTime: 5 * 60 * 1000,
      enabled: isAuthenticated,
    });

  const recommendations = recommendationsData?.data || [];
  const recommendedIds = useMemo(
    () => (recommendationsData?.data ?? []).map((r) => String(r.id)),
    [recommendationsData]
  );

  // Cursor-based infinite scroll backed by `GET /api/v1/ads/feed`.
  // Replaces the previous offset pagination — no `COUNT(*)`, no `OFFSET N`,
  // scales linearly regardless of catalogue size.
  const {
    data: adsData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['ads-feed', selectedCategory, recommendedIds, feedSort],
    queryFn: ({ pageParam }) =>
      adsService.feed({
        cursor: pageParam ?? undefined,
        per_page: 20,
        type: selectedCategory || undefined,
        sort: feedSort,
        exclude_ids: recommendedIds.length > 0 ? recommendedIds : undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.meta.next_cursor,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const ads = useMemo(
    () => adsData?.pages.flatMap((p) => p.data) ?? [],
    [adsData]
  );

  // Gap #3: compteur approx depuis la 1ère page
  const totalApproximate = adsData?.pages[0]?.total_approximate;

  // Gap #1: restaure la position de scroll après le retour arrière
  useScrollRestoration('/home', ads.length > 0 || isError);

  const skeletonCount = isMobile ? 4 : 12;
  const showShimmer =
    isLoading || (isFetching && ads.length === 0) || isPending;

  const handleCategoryChange = useCallback(
    (val: string) => {
      startTransition(() => {
        setSelectedCategory(val);
      });
    },
    [startTransition]
  );

  // IntersectionObserver-driven auto-load. Fires `fetchNextPage()` when the
  // sentinel enters the viewport (with a 300px buffer for smooth UX).
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Box sx={{ pb: { xs: 12, sm: 6 } }}>
      <AppTour />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 280, sm: 400, md: 480 }, // Reduced from 340px to keep search bar above fold on iPhone SE
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          py: { xs: 4, sm: 0 },
        }}
      >
        {/* Background — Ken Burns zoom (respects prefers-reduced-motion) */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          initial={{ scale: 1 }}
          animate={{ scale: prefersReducedMotion ? 1 : 1.06 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 8,
            ease: 'easeInOut',
          }}
        >
          <Image
            src="/images/maison-blanche.webp"
            alt="Maison moderne avec jardin — KeyHome"
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 60%',
              willChange: 'transform',
            }}
          />
        </motion.div>
        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.12) 100%)',
          }}
        />

        {/* Content — staggered entrance */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 3, sm: 5, md: 8 },
            maxWidth: 640,
          }}
        >
          <motion.div
            initial={{
              opacity: prefersReducedMotion ? 1 : 0,
              y: prefersReducedMotion ? 0 : 24,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: prefersReducedMotion ? 0 : 0.15,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.8rem', md: '3.6rem' },
                fontWeight: 800,
                color: '#F8F7F5',
                lineHeight: 1.1,
                letterSpacing: -1,
                mb: { xs: 2.5, md: 3 },
                textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              }}
            >
              Un toit qui vous ressemble.
            </Typography>
          </motion.div>

          <motion.div
            initial={{
              opacity: prefersReducedMotion ? 1 : 0,
              y: prefersReducedMotion ? 0 : 20,
            }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: prefersReducedMotion ? 0 : 0.35,
            }}
          >
            <HeroSearch
              cities={cities}
              cityInput={cityInput}
              setCityInput={setCityInput}
              isCitiesLoading={isCitiesLoading}
              onCitySelect={handleCitySelect}
              onGeolocate={handleGeolocate}
              geolocating={geolocating}
            />
          </motion.div>
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
          <MapsHomeWork sx={{ fontSize: 64, color: 'primary.main', mb: 1.5 }} />
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

      {/* ── Personalized greeting ─────────────────────────────────────────── */}
      {isAuthenticated && user?.firstname && (
        <Container
          maxWidth="xl"
          sx={{ pt: 2.5, pb: 0, px: { xs: 2, sm: 3, md: 4 } }}
        >
          <FadeIn delay={0.05} direction="up">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: { xs: 0.5, md: 0 },
              }}
            >
              <WavingHandIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}
              >
                {greeting},{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  {user.firstname}
                </Box>{' '}
                !
              </Typography>
            </Box>
          </FadeIn>
        </Container>
      )}

      {/* ── Profile completion banner (customers only) ────────────────────── */}
      {isAuthenticated && (
        <Container
          maxWidth="xl"
          sx={{ pt: 1.5, pb: 0, px: { xs: 2, sm: 3, md: 4 } }}
        >
          <ClientProfileBanner />
        </Container>
      )}

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
                aria-label={`Filtrer par ${cat.label}`}
                aria-pressed={isActive}
                onClick={() => handleCategoryChange(cat.value)}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{
                  flexShrink: 0,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  '&:active': { transform: 'scale(0.96)' },
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
        {/* When a category is selected: main grid first so filtered results are immediately visible */}
        {selectedCategory ? (
          <>
            {/* Main grid — en premier quand un filtre est actif */}
            <FadeIn delay={0.1} direction="up">
              <Box ref={gridRef} sx={{ mb: 2, scrollMarginTop: '80px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
                    {CATEGORIES.find((c) => c.value === selectedCategory)
                      ?.label || selectedCategory}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isFetching && !showShimmer && (
                      <Typography variant="caption" color="text.secondary">
                        Mise à jour...
                      </Typography>
                    )}
                    <Select
                      value={feedSort}
                      onChange={(e: SelectChangeEvent) =>
                        setFeedSort(e.target.value as typeof feedSort)
                      }
                      size="small"
                      variant="outlined"
                      aria-label="Trier les annonces"
                      startAdornment={
                        <SortIcon sx={{ fontSize: 15, mr: 0.5 }} />
                      }
                      sx={{
                        fontSize: '0.78rem',
                        '& .MuiSelect-select': {
                          py: 0.6,
                          pr: '28px !important',
                        },
                      }}
                    >
                      <MenuItem value="newest">Plus récentes</MenuItem>
                      <MenuItem value="price_asc">Prix croissant</MenuItem>
                      <MenuItem value="price_desc">Prix décroissant</MenuItem>
                    </Select>
                  </Box>
                </Box>
                {totalApproximate !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    {totalApproximate.toLocaleString('fr-FR')} annonces
                    disponibles
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

              {!showShimmer && !isError && ads.length === 0 && (
                <EmptyState
                  variant="customer"
                  icon={<MapsHomeWork sx={{ fontSize: 30 }} />}
                  title="Aucune annonce trouvée"
                  description="Essayez de modifier vos filtres ou revenez plus tard."
                />
              )}

              {(hasNextPage || isFetchingNextPage) && ads.length > 0 && (
                <Box
                  ref={sentinelRef}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 4,
                    py: 3,
                    minHeight: 64,
                  }}
                >
                  {isFetchingNextPage ? (
                    <CircularProgress
                      size={28}
                      aria-label="Chargement de plus d'annonces"
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => void fetchNextPage()}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Charger plus d&apos;annonces
                    </Button>
                  )}
                </Box>
              )}
            </FadeIn>

            <Divider sx={{ my: { xs: 3, md: 4 } }} />

            {/* Recommendations — en dessous quand filtre actif */}
            {isAuthenticated &&
              (isRecommendationsLoading || recommendations.length > 0) && (
                <FadeIn delay={0.15} direction="up">
                  <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      fontWeight={700}
                      gutterBottom
                    >
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
                        touchAction: 'pan-x pan-y',
                      }}
                    >
                      {isRecommendationsLoading
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
                        : recommendations.slice(0, 8).map((ad) => (
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
              )}

            {/* Recently viewed */}
            {recentlyViewed.length > 0 && (
              <FadeIn delay={0.2} direction="up">
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <AccessTimeIcon
                      sx={{ fontSize: 18, color: 'text.secondary' }}
                    />
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      fontWeight={700}
                    >
                      Récemment consultés
                    </Typography>
                  </Box>
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
                      touchAction: 'pan-x pan-y',
                    }}
                  >
                    {recentlyViewed.slice(0, 8).map((ad) => (
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
            )}
          </>
        ) : (
          <>
            {/* Default (Tous): Recommendations et Récemment consultés en premier */}
            {isAuthenticated &&
              (isRecommendationsLoading || recommendations.length > 0) && (
                <FadeIn delay={0.1} direction="up">
                  <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      fontWeight={700}
                      gutterBottom
                    >
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
                        touchAction: 'pan-x pan-y',
                      }}
                    >
                      {isRecommendationsLoading
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
                        : recommendations.slice(0, 8).map((ad) => (
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
                    <Divider sx={{ mt: { xs: 2, md: 3 } }} />
                  </Box>
                </FadeIn>
              )}

            {recentlyViewed.length > 0 && (
              <FadeIn delay={0.15} direction="up">
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <AccessTimeIcon
                      sx={{ fontSize: 18, color: 'text.secondary' }}
                    />
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      fontWeight={700}
                    >
                      Récemment consultés
                    </Typography>
                  </Box>
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
                      touchAction: 'pan-x pan-y',
                    }}
                  >
                    {recentlyViewed.slice(0, 8).map((ad) => (
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
                  <Divider sx={{ mt: { xs: 2, md: 3 } }} />
                </Box>
              </FadeIn>
            )}

            {/* Main grid — Annonces récentes */}
            <FadeIn delay={0.2} direction="up">
              <Box ref={gridRef} sx={{ mb: 2, scrollMarginTop: '80px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
                    {selectedCategory
                      ? CATEGORIES.find((c) => c.value === selectedCategory)
                          ?.label || selectedCategory
                      : 'Annonces récentes'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isFetching && !showShimmer && (
                      <Typography variant="caption" color="text.secondary">
                        Mise à jour...
                      </Typography>
                    )}
                    <Select
                      value={feedSort}
                      onChange={(e: SelectChangeEvent) =>
                        setFeedSort(e.target.value as typeof feedSort)
                      }
                      size="small"
                      variant="outlined"
                      aria-label="Trier les annonces"
                      startAdornment={
                        <SortIcon sx={{ fontSize: 15, mr: 0.5 }} />
                      }
                      sx={{
                        fontSize: '0.78rem',
                        '& .MuiSelect-select': {
                          py: 0.6,
                          pr: '28px !important',
                        },
                      }}
                    >
                      <MenuItem value="newest">Plus récentes</MenuItem>
                      <MenuItem value="price_asc">Prix croissant</MenuItem>
                      <MenuItem value="price_desc">Prix décroissant</MenuItem>
                    </Select>
                  </Box>
                </Box>
                {totalApproximate !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    {totalApproximate.toLocaleString('fr-FR')} annonces
                    disponibles
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

              {!showShimmer && !isError && ads.length === 0 && (
                <EmptyState
                  variant="customer"
                  icon={<MapsHomeWork sx={{ fontSize: 30 }} />}
                  title="Aucune annonce trouvée"
                  description="Essayez de modifier vos filtres ou revenez plus tard."
                />
              )}

              {(hasNextPage || isFetchingNextPage) && ads.length > 0 && (
                <Box
                  ref={sentinelRef}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mt: 4,
                    py: 3,
                    minHeight: 64,
                  }}
                >
                  {isFetchingNextPage ? (
                    <CircularProgress
                      size={28}
                      aria-label="Chargement de plus d'annonces"
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => void fetchNextPage()}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Charger plus d&apos;annonces
                    </Button>
                  )}
                </Box>
              )}
            </FadeIn>
          </>
        )}
      </Container>

      {/* Gap #6: Bouton retour en haut — apparaît après 600px de scroll */}
      <Zoom in={showBackTop}>
        <Tooltip title="Retour en haut" placement="left">
          <Fab
            size="small"
            aria-label="Retour en haut de la page"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            sx={{
              position: 'fixed',
              bottom: { xs: 80, sm: 32 },
              right: { xs: 16, sm: 32 },
              zIndex: 1200,
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Tooltip>
      </Zoom>
    </Box>
  );
}
