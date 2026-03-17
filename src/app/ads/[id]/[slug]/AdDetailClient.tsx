'use client';

import AdLocationMap from '@/components/ads/AdLocationMap';
import PageBreadcrumbs from '@/components/ui/PageBreadcrumbs';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { useUserLocation } from '@/hooks/useUserLocation';
import PropertyAttributes from '@/components/ads/PropertyAttributes';
import StickyPropertyBar from '@/components/ads/StickyPropertyBar';
import TourViewer from '@/components/ads/TourViewer';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewsSection from '@/components/reviews/ReviewsSection';
import PackageCard from '@/components/ui/PackageCard';
import ImageLightbox from '@/components/ui/ImageLightbox';
import ViewingBookingPanel from '@/components/viewing/ViewingBookingPanel';
import QueryError from '@/components/ui/QueryError';
import FadeIn from '@/components/ui/FadeIn';
import AdReportModal from '@/components/ads/AdReportModal';
import CompareDrawer from '@/components/ads/CompareDrawer';
import SimilarAds from '@/components/ads/SimilarAds';
import KeyScoreBadge from '@/components/ads/KeyScoreBadge';
import KeyScoreSection from '@/components/ads/KeyScoreSection';
import { COMPARATOR_MAX_ITEMS, useComparator } from '@/providers/ComparatorProvider';
import { formatDate, formatPrice, formatRelativeDate } from '@/lib/constants';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { adsService } from '@/services/ads.service';
import { creditsService } from '@/services/credits.service';
import { paymentsService } from '@/services/payments.service';
import type { PointPackage, UnlockResponse } from '@/types';
import {
  AccountBalanceWallet,
  ArrowBack,
  BathtubOutlined,
  BedOutlined,
  CalendarMonth,
  Call,
  ChevronLeft,
  CompareArrows,
  ContentCopy,
  Description,
  Email,
  Favorite,
  FavoriteBorder,
  FlagOutlined,
  LocalParking,
  LocationOn,
  Lock,
  Phone,
  ReceiptLong,
  Schedule,
  Share,
  SquareFootOutlined,
  Star,
  Verified,
  Visibility,
  ViewInAr,
  WhatsApp,
} from '@mui/icons-material';
import AppLoader from '@/components/ui/AppLoader';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Slide,
  Snackbar,
  Typography,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { forwardRef, Suspense, useEffect, useMemo, useRef, useState } from 'react';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MIN_UNLOCK_LOADER_MS = 2000;

function AdDetailContent() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const { add: addToComparator, remove: removeFromComparator, isSelected: isInComparator } = useComparator();
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPackageLoading, setIsPackageLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [unlockState, setUnlockState] = useState<UnlockResponse | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [hasStoredSanctumToken, setHasStoredSanctumToken] = useState<boolean | null>(null);
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const refreshedRef = useRef(false);
  const viewTrackedRef = useRef(false);

  // After a successful payment, payment-success stores the adId in sessionStorage.
  // We read it here to invalidate the cache and get fresh unlocked data — no URL param needed.
  useEffect(() => {
    if (!adId || refreshedRef.current) { return; }
    const justUnlocked = sessionStorage.getItem('kh_just_unlocked') === adId;
    if (justUnlocked) {
      refreshedRef.current = true;
      sessionStorage.removeItem('kh_just_unlocked');
      queryClient.invalidateQueries({ queryKey: ['ad', adId, isAuthenticated] });
    }
  }, [adId, isAuthenticated, queryClient]);

  // Track view once per page load — feeds the recommendation engine.
  useEffect(() => {
    if (adId && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      adsService.trackView(adId);
    }
  }, [adId]);

  // Prevent a guest fetch flash on refresh when a token exists in storage
  // but AuthProvider has not finished hydrating the authenticated user yet.
  useEffect(() => {
    try {
      setHasStoredSanctumToken(!!localStorage.getItem('kh_sanctum_token'));
    } catch {
      setHasStoredSanctumToken(false);
    }
  }, []);

  const { data: ad, isLoading, isError, refetch } = useQuery({
    queryKey: ['ad', adId, isAuthenticated],
    queryFn: () => adsService.show(adId),
    enabled: !!adId
      && hasStoredSanctumToken !== null
      && !isAuthLoading
      && (isAuthenticated || !hasStoredSanctumToken),
  });

  const { addRecentlyViewed } = useRecentlyViewed();
  const { play: playSound } = useSoundFeedback();
  const { location: userLocation, error: locationError } = useUserLocation();

  // Track the ad in recently viewed once it loads
  useEffect(() => {
    if (ad) {
      addRecentlyViewed(ad);
    }
  }, [ad, addRecentlyViewed]);

  // Live balance query — shares the same cache key as CreditsWidget so both
  // always display the same value and a single fetch satisfies both consumers.
  const { data: liveBalance } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    staleTime: 15_000,
    enabled: isAuthenticated,
  });
  const descriptionText = ad?.description ?? '';
  const descriptionParagraphs = useMemo(
    () => descriptionText.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
    [descriptionText]
  );
  const hasExpandableDescription = descriptionParagraphs.length > 1;
  const visibleDescription = hasExpandableDescription && !showFullDescription
    ? descriptionParagraphs[0]
    : descriptionText;

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <QueryError
          onRetry={() => refetch()}
          message="Impossible de charger cette annonce. Elle a peut-être été supprimée ou votre connexion est instable."
        />
      </Container>
    );
  }

  if (isLoading || !ad) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="text" width="60%" sx={{ fontSize: '2rem' }} />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="70%" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  const allImages = ad.images || [];
  const primaryImage = allImages.find((img) => img.is_primary) || allImages[0];
  // SECURITY: isLocked must depend ONLY on server response, never on URL params
  const isLocked = ad.is_unlocked === false;
  // When locked, only show the primary image
  const images = isLocked ? (primaryImage ? [primaryImage] : []) : allImages;

  const totalImageCount = ad.total_images || allImages.length;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `${ad.title} — ${formatPrice(ad.price)}`;
    // Always copy to clipboard first
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* ignore */ }
    // Then try native share sheet (mobile + Safari)
    if (navigator.share) {
      try {
        await navigator.share({ title: ad.title, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      setSnackbar('Lien copié dans le presse-papier');
    }
  };

  const handleUnlock = async () => {
    const startedAt = Date.now();
    setPaymentError('');
    setUnlockState(null);
    setIsPaymentLoading(true);
    try {
      const response = await paymentsService.initialize(ad.id);
      setUnlockState(response);
      if (response.status === 'unlocked' || response.status === 'already_unlocked' || response.status === 'owner') {
        // Refresh the ad to show unlocked content
        await queryClient.invalidateQueries({ queryKey: ['ad', adId, isAuthenticated] });
        // Immediately write the server-confirmed balance into the shared cache.
        // setQueryData is synchronous \u2014 the Navbar widget and dialog both update
        // in the same render cycle with zero network wait.
        if (response.points_balance !== undefined) {
          queryClient.setQueryData<number>(['credits-balance'], response.points_balance);
        } else {
          const pointsUsed = response.points_used ?? 0;
          queryClient.setQueryData<number>(['credits-balance'], (old) => Math.max(0, (old ?? 0) - pointsUsed));
        }
        queryClient.invalidateQueries({ queryKey: ['unlocked-ads'] });
        setPaymentDialogOpen(false);
        setSnackbar('Annonce déverrouillée avec succès !');
      }
      // For 'insufficient_points' → modal stays open and shows packages
    } catch (err) {
      setPaymentError(getSafeErrorMessage(err, 'Erreur lors du déverrouillage.'));
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = MIN_UNLOCK_LOADER_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setIsPaymentLoading(false);
    }
  };

  const handlePurchasePackage = async (pkg: PointPackage) => {
    setIsPackageLoading(pkg.id);
    setPaymentError('');
    try {
      const callbackUrl = `${window.location.origin}/credits/callback?ad_id=${ad.id}`;
      const response = await creditsService.purchase(pkg.id, callbackUrl);
      if (!redirectToTrustedUrl(response.payment_url)) {
        throw new Error('URL de paiement non approuvée.');
      }
    } catch (err) {
      setPaymentError(getSafeErrorMessage(err, 'Erreur lors de l\'initialisation du paiement.'));
    } finally {
      setIsPackageLoading(null);
    }
  };

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const features = [
    { icon: <BedOutlined />, label: `${ad.bedrooms} chambre${ad.bedrooms > 1 ? 's' : ''}`, show: ad.bedrooms > 0 },
    { icon: <BathtubOutlined />, label: `${ad.bathrooms} salle${ad.bathrooms > 1 ? 's' : ''} de bain`, show: ad.bathrooms > 0 },
    { icon: <SquareFootOutlined />, label: `${ad.surface_area} m²`, show: ad.surface_area > 0 },
    { icon: <LocalParking />, label: 'Parking', show: ad.has_parking },
  ].filter((f) => f.show);

  const publisherName = ad.published_by || 'Annonceur';
  const publisherPhone = ad.user?.phone_number;
  const publisherEmail = ad.user?.email;
  const publisherHasWhatsApp = ad.user?.phone_is_whatsapp ?? false;
  const reviews = ad.reviews ?? [];
  const reviewsCount = ad.reviews_count ?? reviews.length;
  const averageRating = ad.rating ?? (reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null);
  const currentBalance = unlockState?.current_balance ?? liveBalance ?? currentUser?.point_balance ?? 0;
  const hasSupplementaryInfo = !!(ad?.deposit_amount || ad?.minimum_lease_duration || ad?.detailed_charges || ad?.property_condition_pdf);

  // Format phone number for WhatsApp (remove spaces, dashes, etc.)
  const whatsappNumber = publisherPhone?.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

  return (
    <>
      <Box sx={{ position: 'relative', overflowX: 'hidden' }}>
        {/* Mobile: full-bleed photo hero + floating back button */}
        <Box
          onClick={() => !isLocked && openLightbox(0)}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'relative',
            width: '100vw',
            maxWidth: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            height: '55vh',
            minHeight: 320,
            maxHeight: 500,
            cursor: isLocked ? 'default' : 'pointer',
            borderRadius: '0 0 24px 24px',
            overflow: 'hidden',
          }}
        >
          {primaryImage && (
            <Image
              src={primaryImage.large || primaryImage.url}
              alt={ad.title}
              fill
              priority
              sizes="100vw"
              style={{
                objectFit: 'cover',
                filter: isLocked ? 'blur(12px) brightness(0.85)' : 'none',
              }}
            />
          )}
          {!primaryImage && (
            <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">Aucune photo</Typography>
            </Box>
          )}
          {/* Lock overlay — mobile, when locked */}
          {isLocked && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.28) 100%)',
                zIndex: 3,
                px: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 4,
                  px: 3,
                  py: 2,
                  maxWidth: 340,
                  width: '100%',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: 'rgba(246,71,95,0.88)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(246,71,95,0.4)',
                  }}
                >
                  <Lock sx={{ fontSize: 26, color: '#fff' }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontSize: '0.9rem' }}
                >
                  {totalImageCount} photo{totalImageCount > 1 ? 's' : ''} disponible{totalImageCount > 1 ? 's' : ''}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.4, textShadow: '0 1px 3px rgba(0,0,0,0.2)', fontSize: '0.8rem' }}
                >
                  Déverrouillez pour voir toutes les photos
                </Typography>
              </Box>
            </Box>
          )}
          {/* Photo pagination badge — hidden when locked (lock overlay shows count) */}
          {images.length > 1 && !isLocked && (
            <Box
              onClick={() => openLightbox(0)}
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 2,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              1/{images.length}
            </Box>
          )}
          {/* Floating back button */}
          <IconButton
            onClick={() => router.back()}
            aria-label="Retour"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 3,
              bgcolor: 'rgba(255,255,255,0.95)',
              color: 'text.primary',
              '&:hover': { bgcolor: '#fff' },
              boxShadow: 1,
            }}
          >
            <ChevronLeft />
          </IconButton>
        </Box>

        <Container maxWidth="xl" sx={{ pt: { xs: 0, md: 3 }, pb: { xs: 14, md: 3 }, overflow: { xs: 'visible', md: 'hidden', xl: 'visible' }, overflowX: 'hidden', px: { xs: 2.5, sm: 3, md: 4 } }}>
          {/* Breadcrumbs — desktop only (mobile uses floating back button above) */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <PageBreadcrumbs
              items={[
                { label: 'Accueil', href: '/home' },
                { label: 'Rechercher', href: '/search' },
                { label: ad?.title ?? 'Annonce' },
              ]}
              showBack={false}
            />
          </Box>

          {/* Image gallery — desktop only (mobile uses hero above) */}
          <FadeIn delay={0.1} direction="none">
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        {/* ── LOCKED state : simple Box — not a CSS Grid ────────────────────────
             CSS Grid containers do NOT reliably clip their children using
             overflow:hidden + border-radius in Chrome / Safari.
             Use a plain Box with the border-radius applied directly so the
             single blurred image is always visually rounded. */}
        {isLocked ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: '420px', md: '560px' },
              borderRadius: 3,
              overflow: 'hidden',
              mb: 3,
            }}
          >
            {primaryImage ? (
              <Image
                src={primaryImage.large || primaryImage.url}
                alt={ad.title}
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: 'cover',
                  filter: 'blur(12px) brightness(0.85)',
                  borderRadius: 'inherit',
                }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Aucune photo</Typography>
              </Box>
            )}

            {/* Lock overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.28) 100%)',
                zIndex: 3,
                px: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 4,
                  px: { xs: 3, sm: 5 },
                  py: { xs: 2, sm: 3 },
                  maxWidth: 340,
                  width: '100%',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: 'rgba(246,71,95,0.88)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(246,71,95,0.4)',
                  }}
                >
                  <Lock sx={{ fontSize: 26, color: '#fff' }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  {totalImageCount} photo{totalImageCount > 1 ? 's' : ''} disponible{totalImageCount > 1 ? 's' : ''}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.4, textShadow: '0 1px 3px rgba(0,0,0,0.2)', fontSize: '0.8rem' }}
                >
                  Déverrouillez pour voir toutes les photos
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* ── UNLOCKED state : CSS Grid for multi-image layout ───────────────── */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: images.length >= 5 ? '2fr 1fr 1fr'
                  : images.length >= 3 ? '2fr 1fr'
                  : images.length === 2 ? '1fr 1fr'
                  : '1fr',
              },
              gridTemplateRows: {
                xs: images.length <= 1 ? '300px' : '260px',
                md: images.length <= 1 ? '400px' : '210px 210px',
              },
              gap: '4px',
              borderRadius: 3,
              overflow: 'hidden',
              mb: 3,
            }}
          >
            {/* Main image */}
            <Box
              onClick={() => openLightbox(0)}
              sx={{
                gridRow: { md: images.length >= 3 ? '1 / 3' : images.length === 2 ? '1 / 3' : 'auto' },
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                '&:hover img': { transform: 'scale(1.03)' },
              }}
            >
              {primaryImage ? (
                <Image
                  src={primaryImage.large || primaryImage.url}
                  alt={ad.title}
                  fill
                  priority
                  sizes="(max-width: 960px) 100vw, 60vw"
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                />
              ) : (
                <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">Aucune photo</Typography>
                </Box>
              )}
            </Box>

            {/* Secondary images */}
            {images.slice(1, 5).map((img, idx) => (
              <Box
                key={img.id}
                onClick={() => openLightbox(idx + 1)}
                sx={{
                  display: { xs: 'none', md: 'block' },
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  '&:hover img': { transform: 'scale(1.05)' },
                }}
              >
                <Image
                  src={img.thumb || img.url}
                  alt={`${ad.title} ${idx + 2}`}
                  fill
                  sizes="(max-width: 960px) 0px, 20vw"
                  style={{
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </Box>
            ))}

            {/* "Show all photos" overlay on last visible image */}
            {images.length > 5 && (
              <Box
                onClick={() => openLightbox(4)}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  zIndex: 3,
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(20,20,20,0.9)'
                      : 'rgba(255,255,255,0.95)',
                    color: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.96)'
                      : 'rgba(17,24,39,0.95)',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(17,24,39,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      bgcolor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(28,28,28,0.95)'
                        : '#fff',
                    },
                  }}
                >
                  Voir les {images.length} photos
                </Button>
              </Box>
            )}
          </Box>
        )}

          </Box>
        </FadeIn>

        {/* White rounded card — mobile (Airbnb-style); desktop uses display:contents so children flow through */}
        <Paper
          elevation={0}
          sx={{
            display: { xs: 'block', md: 'contents' },
            width: { xs: '100vw', md: 'auto' },
            maxWidth: { xs: '100vw', md: 'none' },
            marginLeft: { xs: 'calc(50% - 50vw)', md: 0 },
            borderRadius: { xs: '24px 24px 0 0', md: 0 },
            mt: { xs: '-28px', md: 0 },
            position: { xs: 'relative', md: 'static' },
            zIndex: { xs: 10, md: 0 },
            px: { xs: 2.5, md: 0 },
            pt: { xs: 2.5, md: 0 },
            pb: { xs: 2, md: 0 },
            bgcolor: { xs: 'background.paper', md: 'transparent' },
            boxShadow: { xs: '0 -4px 24px rgba(0,0,0,0.08)', md: 'none' },
            overflow: { xs: 'hidden', md: 'visible' },
          }}
        >
          {/* Action buttons — mobile, inside white card */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Share sx={{ fontSize: 16 }} />}
              onClick={handleShare}
              sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
            >
              Partager
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={checkFav(ad.id) ? <Favorite sx={{ color: 'primary.main' }} /> : <FavoriteBorder />}
              onClick={() => {
                const wasFav = checkFav(ad.id);
                playSound(wasFav ? 'unfavorite' : 'favorite');
                toggleFav(ad);
                if (!wasFav) { setSnackbar('Annonce sauvegardée. Vous la retrouverez dans vos favoris.'); }
              }}
              sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: checkFav(ad.id) ? 'primary.main' : 'text.primary' }}
            >
              {checkFav(ad.id) ? 'Sauvegardé' : 'Sauvegarder'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CompareArrows sx={{ fontSize: 16 }} />}
              onClick={() => {
                const wasIn = isInComparator(ad.id);
                if (wasIn) {
                  removeFromComparator(ad.id);
                } else {
                  addToComparator(ad);
                  setCompareDrawerOpen(true);
                  setSnackbar(`Ajouté au comparateur. Comparez jusqu'à ${COMPARATOR_MAX_ITEMS} annonces.`);
                }
              }}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                borderColor: isInComparator(ad.id) ? 'primary.main' : 'divider',
                color: isInComparator(ad.id) ? 'primary.main' : 'text.primary',
              }}
            >
              Comparer
            </Button>
            {!isLocked && <KeyScoreBadge adId={ad.id} size="small" />}
          </Box>

        {/* Action buttons — desktop only */}
        <FadeIn delay={0.2} direction="up">
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Share sx={{ fontSize: 16 }} />}
            onClick={handleShare}
            sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: 'text.primary' }}
          >
            Partager
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={checkFav(ad.id) ? <Favorite sx={{ color: 'primary.main' }} /> : <FavoriteBorder />}
            onClick={() => {
              const wasFav = checkFav(ad.id);
              playSound(wasFav ? 'unfavorite' : 'favorite');
              toggleFav(ad);
              if (!wasFav) { setSnackbar('Annonce sauvegardée. Vous la retrouverez dans vos favoris.'); }
            }}
            sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: checkFav(ad.id) ? 'primary.main' : 'text.primary' }}
          >
            {checkFav(ad.id) ? 'Sauvegardé' : 'Sauvegarder'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CompareArrows sx={{ fontSize: 16 }} />}
            onClick={() => {
              const wasIn = isInComparator(ad.id);
              if (wasIn) {
                removeFromComparator(ad.id);
              } else {
                addToComparator(ad);
                setCompareDrawerOpen(true);
                setSnackbar(`Ajouté au comparateur. Comparez jusqu'à ${COMPARATOR_MAX_ITEMS} annonces.`);
              }
            }}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              borderColor: isInComparator(ad.id) ? 'primary.main' : 'divider',
              color: isInComparator(ad.id) ? 'primary.main' : 'text.primary',
            }}
          >
            {isInComparator(ad.id) ? '✓ Comparé' : 'Comparer'}
          </Button>
          {!isLocked && <KeyScoreBadge adId={ad.id} size="small" />}
        </Box>
        </FadeIn>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(0, 1fr) 380px',
              lg: 'minmax(0, 1fr) 420px',
              xl: 'minmax(0, 1fr) 420px 300px',
            },
            gap: { xs: 2, md: 4 },
            alignItems: 'start',
          }}
        >
          {/* Left column — details */}
          <Box sx={{ minWidth: 0, overflow: 'visible', overflowWrap: 'break-word', maxWidth: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                }}
              >
                {ad.title}
              </Typography>
              {ad.is_verified && (
                <Chip
                  icon={<Verified sx={{ fontSize: 16 }} />}
                  label="Bien vérifié"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />
              )}
            </Box>
            {/* Preuve sociale + urgence douce — uniquement si annonce déverrouillée */}
            {!isLocked && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, alignItems: 'center' }}>
                {(ad.views_count_today ?? 0) > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    {ad.views_count_today} personne{(ad.views_count_today ?? 0) > 1 ? 's ont' : ' a'} consulté cette annonce aujourd&apos;hui
                  </Typography>
                )}
                {(ad.views_count_week ?? 0) >= 5 && (ad.views_count_today ?? 0) === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    Vu {ad.views_count_week} fois cette semaine
                  </Typography>
                )}
                {(ad.view_count ?? 0) >= 10 && (ad.views_count_today ?? 0) === 0 && (ad.views_count_week ?? 0) < 5 && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    Annonce très consultée
                  </Typography>
                )}
                {ad.available_from && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarMonth sx={{ fontSize: 16 }} />
                    Disponible à partir du {formatDate(ad.available_from)}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Mise à jour {formatRelativeDate(ad.updated_at).toLowerCase()}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {ad.quarter?.name}
                {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
                {ad.adresse ? ` — ${ad.adresse}` : ''}
              </Typography>
            </Box>
            {/* Features pills */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, minWidth: 0 }}>
              {features.map((f, idx) => (
                <Chip key={idx} icon={f.icon as React.ReactElement} label={f.label} variant="outlined" sx={{ borderRadius: 2 }} />
              ))}
              {ad.type && <Chip label={ad.type.name} color="primary" variant="outlined" sx={{ borderRadius: 2 }} />}
            </Box>

            {/* 3D Tour — locked teaser or unlocked button */}
            {ad.has_3d_tour && (
              <Box sx={{ mb: 3 }}>
                {isLocked ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      borderRadius: 3,
                      border: '1px dashed',
                      borderColor: 'divider',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FAFAFA',
                      opacity: 0.8,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: 'rgba(246,71,95,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ViewInAr sx={{ fontSize: 22, color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                        Visite Virtuelle 3D disponible
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ad.tour_scenes_count
                          ? `${ad.tour_scenes_count} pièce${ad.tour_scenes_count > 1 ? 's' : ''} à explorer`
                          : 'Déverrouillez pour accéder à la visite 360°'}
                      </Typography>
                    </Box>
                    <Lock sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                  </Box>
                ) : (
                  ad.tour_config && (
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<ViewInAr sx={{ fontSize: 22 }} />}
                      onClick={() => setShowTour(true)}
                      sx={{
                        width: { xs: '100%', sm: 'fit-content' },
                        minWidth: { sm: 250 },
                        maxWidth: 360,
                        py: 1.1,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: 3,
                        bgcolor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : '#F7F7F7',
                        color: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.96)'
                          : 'text.primary',
                        borderColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.2)'
                          : 'divider',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        justifyContent: 'flex-start',
                        gap: 1,
                        textTransform: 'none',
                        letterSpacing: 0.2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.12)'
                            : '#EFEFEF',
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.3)'
                            : 'text.disabled',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                          transform: 'translateY(-1px)',
                        },
                        '&:active': { transform: 'scale(0.98)' },
                      }}
                    >
                      <Box sx={{ flex: 1, textAlign: 'left' }}>
                        <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          Visiter en 3D
                        </Typography>
                        {ad.tour_scenes_count != null && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 400,
                              color: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.78)'
                                : 'text.secondary',
                            }}
                          >
                            {ad.tour_scenes_count} pièce{ad.tour_scenes_count > 1 ? 's' : ''} · visite immersive 360°
                          </Typography>
                        )}
                      </Box>
                    </Button>
                  )
                )}
              </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Publisher info — blurred if locked */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar src={ad.user?.avatar || undefined} sx={{ width: 48, height: 48 }}>
                {publisherName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Publié par {publisherName}
                  </Typography>
                  {ad.is_verified && <Verified sx={{ fontSize: 16, color: 'success.main' }} titleAccess="Annonce vérifiée" />}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeDate(ad.created_at)}
                </Typography>
              </Box>
            </Box>

            {/* Description — Airbnb-style truncated + slide-up panel */}
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Box sx={{ position: 'relative', mb: 1 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.8,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  minWidth: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 6,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {descriptionText}
              </Typography>
              {descriptionText.length > 200 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    background: (theme) =>
                      `linear-gradient(to bottom, ${theme.palette.mode === 'dark' ? 'rgba(18,18,18,0)' : 'rgba(255,255,255,0)'}, ${theme.palette.mode === 'dark' ? 'rgba(18,18,18,1)' : 'rgba(255,255,255,1)'})`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
            {descriptionText.length > 200 && (
              <Button
                onClick={() => setShowFullDescription(true)}
                size="small"
                sx={{
                  mb: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 0,
                  color: 'text.primary',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  '&:hover': { bgcolor: 'transparent', textDecorationColor: 'primary.main' },
                }}
              >
                Lire la suite ›
              </Button>
            )}
            {descriptionText.length <= 200 && <Box sx={{ mb: 3 }} />}

            {/* Description full-screen slide-up panel */}
            <Dialog
              open={showFullDescription}
              onClose={() => setShowFullDescription(false)}
              fullScreen
              TransitionComponent={SlideUpTransition}
              PaperProps={{
                sx: {
                  bgcolor: 'background.default',
                },
              }}
            >
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  bgcolor: 'background.default',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <IconButton
                  onClick={() => setShowFullDescription(false)}
                  aria-label="Retour"
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
                  Description
                </Typography>
              </Box>
              <Box sx={{ px: { xs: 2.5, sm: 4, md: 6 }, py: { xs: 3, sm: 4 }, maxWidth: 720, mx: 'auto', width: '100%' }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  À propos de ce logement
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {ad.title}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-line',
                    lineHeight: 2,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    color: 'text.secondary',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    letterSpacing: 0.2,
                  }}
                >
                  {descriptionText}
                </Typography>
              </Box>
            </Dialog>

            <Divider sx={{ mb: 3 }} />

            {/* Property Attributes */}
            {ad.attributes && ad.attributes.length > 0 && (
              <>
                <PropertyAttributes
                  attributes={ad.attributes}
                  maxDisplay={9}
                  variant="list"
                  showTitle
                />
                <Divider sx={{ my: 3 }} />
              </>
            )}

            {/* Location map */}
            {ad.location && (
              <>
                <AdLocationMap
                  latitude={ad.location.latitude}
                  longitude={ad.location.longitude}
                  quartierName={ad.quarter?.name}
                  cityName={ad.quarter?.city_name}
                  isLocked={isLocked}
                  userLocation={userLocation}
                  locationError={locationError}
                />
                <Divider sx={{ my: 3 }} />
              </>
            )}

            {/* Reviews & ratings */}
            <ReviewsSection
              reviews={reviews}
              averageRating={averageRating}
              reviewsCount={reviewsCount}
            />

            {/* Review submission form */}
            <ReviewForm
              adId={ad.id}
              hasUserReviewed={!!(currentUser && ad.reviews?.some(r => r.user?.id === currentUser.id))}
            />

            {/* Mobile-only: contact info + supplementary info + report + KeyScore */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 3 }}>

              {/* Contact section — mobile only (desktop has it in the right sidebar) */}
              {!isLocked && (publisherPhone || publisherEmail) && (
                <Paper
                  id="contact-section"
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Ne ratez pas cette opportunité — contactez l&apos;annonceur pour réserver une visite.
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Contact de l&apos;annonceur
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <Schedule sx={{ fontSize: 14 }} />
                    Répond généralement en moins de 2 h
                  </Typography>
                  {reviewsCount > 0 && averageRating != null && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                      {averageRating.toFixed(1)}/5 — {reviewsCount} avis
                    </Typography>
                  )}
                  {publisherPhone && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Phone sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>{publisherPhone}</Typography>
                        <IconButton size="small" aria-label="Copier le numéro" onClick={() => { navigator.clipboard.writeText(publisherPhone); setSnackbar('Numéro copié !'); }}>
                          <ContentCopy sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {publisherHasWhatsApp && whatsappNumber && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<WhatsApp sx={{ fontSize: 18 }} />}
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour,\n\nJe vous contacte suite à votre annonce *${ad.title}* que j'ai vue sur KeyHome.\n\nJe suis intéressé(e) par ce bien et souhaiterais avoir plus d'informations.\n\nCordialement${currentUser?.firstname ? `, ${currentUser.firstname}` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: '#0D9488',
                              '&:hover': { bgcolor: '#128C7E' },
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            WhatsApp
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Call sx={{ fontSize: 18 }} />}
                          href={`tel:${publisherPhone}`}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          Appeler
                        </Button>
                      </Box>
                    </Box>
                  )}
                  {publisherEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: publisherPhone ? 0 : 0 }}>
                      <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all', minWidth: 0, flex: 1 }}>{publisherEmail}</Typography>
                      <IconButton size="small" aria-label="Copier l'email" onClick={() => { navigator.clipboard.writeText(publisherEmail); setSnackbar('Email copié !'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Paper>
              )}

              {/* Unlock CTA — mobile only, when locked */}
              {isLocked && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 3,
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                    {formatPrice(ad.price)}
                  </Typography>
                  {ad.type && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {ad.type.name}
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => {
                      if (!isAuthenticated) {
                        sessionStorage.setItem('kh_redirect_after_login', window.location.pathname + window.location.search);
                        router.push('/login');
                        return;
                      }
                      setPaymentDialogOpen(true);
                    }}
                    startIcon={<Lock />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1rem',
                      background: (theme) => theme.palette.gradient?.primary ?? 'linear-gradient(to right, #F6475F, #D93A50)',
                      '&:hover': { background: (theme) => theme.palette.gradient?.primaryHover ?? 'linear-gradient(to right, #E03E54, #C53248)' },
                    }}
                  >
                    Déverrouiller
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Accédez aux coordonnées de l&apos;annonceur
                  </Typography>
                </Paper>
              )}

              {!isLocked && hasSupplementaryInfo && (
                <Box
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.08)' : 'rgba(246,71,95,0.04)',
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.25)' : 'rgba(246,71,95,0.18)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Star sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Informations supplémentaires
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {ad.deposit_amount && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <AccountBalanceWallet sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Dépôt de garantie: <strong>{ad.deposit_amount}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.minimum_lease_duration && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <CalendarMonth sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Durée minimum: <strong>{ad.minimum_lease_duration}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.detailed_charges && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                        <ReceiptLong sx={{ fontSize: 17, color: 'text.secondary', mt: 0.3 }} />
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          Charges: <strong>{ad.detailed_charges}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.property_condition_pdf && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Description sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Button
                          variant="text"
                          size="small"
                          href={ad.property_condition_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            p: 0,
                            minWidth: 0,
                            fontWeight: 600,
                            color: 'primary.main',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                          }}
                        >
                          Télécharger l&apos;état des lieux
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {!isLocked && <KeyScoreSection adId={ad.id} />}

              <Divider sx={{ my: 2 }} />
              <Button
                fullWidth
                variant="text"
                startIcon={<FlagOutlined />}
                onClick={() => {
                  if (!isAuthenticated) {
                    sessionStorage.setItem('kh_redirect_after_login', window.location.pathname + window.location.search);
                    router.push('/login');
                    return;
                  }
                  setReportModalOpen(true);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textDecoration: 'underline',
                  '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                }}
              >
                Signaler cette annonce
              </Button>
            </Box>

          </Box>

          {/* Right column — pricing card (hidden on mobile, StickyPropertyBar handles it) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: { md: 'sticky' },
              top: { md: 112, lg: 120 },
              alignSelf: 'start',
              zIndex: 1,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 3,
                boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Typography variant="h4" fontWeight={700}>
                {formatPrice(ad.price)}
              </Typography>
              {ad.type && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {ad.type.name}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {!isLocked && hasSupplementaryInfo && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.08)' : 'rgba(246,71,95,0.04)',
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.25)' : 'rgba(246,71,95,0.18)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Star sx={{ fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                      Informations supplémentaires
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {ad.deposit_amount && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <AccountBalanceWallet sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Dépôt de garantie: <strong>{ad.deposit_amount}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.minimum_lease_duration && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <CalendarMonth sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Durée minimum: <strong>{ad.minimum_lease_duration}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.detailed_charges && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                        <ReceiptLong sx={{ fontSize: 17, color: 'text.secondary', mt: 0.3 }} />
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          Charges: <strong>{ad.detailed_charges}</strong>
                        </Typography>
                      </Box>
                    )}
                    {ad.property_condition_pdf && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Description sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Button
                          variant="text"
                          size="small"
                          href={ad.property_condition_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            p: 0,
                            minWidth: 0,
                            fontWeight: 600,
                            color: 'primary.main',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                          }}
                        >
                          Télécharger l&apos;état des lieux
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {isLocked ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => {
                      if (!isAuthenticated) {
                        sessionStorage.setItem('kh_redirect_after_login', window.location.pathname + window.location.search);
                        router.push('/login');
                        return;
                      }
                      setPaymentDialogOpen(true);
                    }}
                    startIcon={<Lock />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1rem',
                      background: (theme) => theme.palette.gradient?.primary ?? 'linear-gradient(to right, #F6475F, #D93A50)',
                      '&:hover': { background: (theme) => theme.palette.gradient?.primaryHover ?? 'linear-gradient(to right, #E03E54, #C53248)' },
                      '&:active': { transform: 'scale(0.97)' },
                    }}
                  >
                    Déverrouiller
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                    Utilisez vos crédits pour accéder aux coordonnées de l&apos;annonceur
                  </Typography>
                  <Box sx={{ mt: 2, px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ filter: 'blur(4px)', userSelect: 'none', color: 'text.secondary' }} aria-hidden>
                        +237 6** *** **9
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WhatsApp sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ filter: 'blur(4px)', userSelect: 'none', color: 'text.secondary' }} aria-hidden>
                        +237 6** *** **9
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ filter: 'blur(4px)', userSelect: 'none', color: 'text.secondary' }} aria-hidden>
                        ****@****.com
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Ne ratez pas cette opportunité — contactez l&apos;annonceur pour réserver une visite.
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Contact de l&apos;annonceur
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <Schedule sx={{ fontSize: 14 }} />
                    Répond généralement en moins de 2 h
                  </Typography>
                  {reviewsCount > 0 && averageRating != null && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                      <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                      {averageRating.toFixed(1)}/5 — {reviewsCount} avis
                    </Typography>
                  )}
                  {publisherPhone && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Phone sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>{publisherPhone}</Typography>
                        <IconButton size="small" aria-label="Copier le numéro" onClick={() => { navigator.clipboard.writeText(publisherPhone); setSnackbar('Numéro copié !'); }}>
                          <ContentCopy sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {publisherHasWhatsApp && whatsappNumber && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<WhatsApp sx={{ fontSize: 18 }} />}
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour,\n\nJe vous contacte suite à votre annonce *${ad.title}* que j'ai vue sur KeyHome.\n\nJe suis intéressé(e) par ce bien et souhaiterais avoir plus d'informations.\n\nCordialement${currentUser?.firstname ? `, ${currentUser.firstname}` : ''}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: '#0D9488',
                              '&:hover': { bgcolor: '#128C7E' },
                            }}
                          >
                            WhatsApp — Contactez en 1 clic
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Call sx={{ fontSize: 18 }} />}
                          href={`tel:${publisherPhone}`}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                          }}
                        >
                          Appeler
                        </Button>
                      </Box>
                    </Box>
                  )}
                  {publisherEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>{publisherEmail}</Typography>
                      <IconButton size="small" aria-label="Copier l'email" onClick={() => { navigator.clipboard.writeText(publisherEmail); setSnackbar('Email copié !'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}

                  {/* Viewing appointment booking — only when unlocked */}
                  <Divider sx={{ mt: 2.5, mb: 0 }} />
                  <ViewingBookingPanel adId={ad.id} adTitle={ad.title} variant="contained" />
                </Box>
              )}

              <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  fullWidth
                  variant="text"
                  startIcon={<FlagOutlined />}
                  onClick={() => {
                    if (!isAuthenticated) {
                      sessionStorage.setItem('kh_redirect_after_login', window.location.pathname + window.location.search);
                      router.push('/login');
                      return;
                    }
                    setReportModalOpen(true);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textDecoration: 'underline',
                    '&:hover': { bgcolor: 'transparent', color: 'text.primary' },
                  }}
                >
                  Signaler cette annonce
                </Button>
              </Box>
            </Paper>

            {/* KeyScore section — only when unlocked */}
            {!isLocked && <Box sx={{ mt: 2 }}><KeyScoreSection adId={ad.id} /></Box>}
          </Box>

          {/* Third column — similar ads sidebar (xl only) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'none', lg: 'none', xl: 'flex' },
              flexDirection: 'column',
              position: 'sticky',
              top: 80,
              alignSelf: 'start',
              maxHeight: 'calc(100vh - 60px)',
              minHeight: 400,
            }}
          >
            <Typography variant="h5" fontWeight={700} mb={0.5} sx={{ fontSize: '1rem', flexShrink: 0 }}>
              Annonces similaires
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, flexShrink: 0, display: 'block' }}>
              D&apos;autres biens correspondant à votre recherche
            </Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                pb: 6,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
              }}
            >
              <SimilarAds currentAdId={adId} variant="sidebar" hideTitle hideContext />
            </Box>
          </Box>
        </Box>
        </Paper>
      </Container>
      </Box>

      {/* Unlock / Credits dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => { setPaymentDialogOpen(false); setUnlockState(null); setPaymentError(''); setConfirmStep(false); }}
        maxWidth={unlockState?.status === 'insufficient_points' ? 'lg' : 'xs'}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            maxWidth: unlockState?.status === 'insufficient_points'
              ? { xs: '92vw', md: 980 }
              : undefined,
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          {/* Gradient lock icon */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: (theme) => theme.palette.gradient?.primary135 ?? 'linear-gradient(135deg, #F6475F, #D93A50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 0 0 8px rgba(246,71,95,0.1), 0 8px 24px rgba(246,71,95,0.25)',
            }}
          >
            <Lock sx={{ color: '#fff', fontSize: 30 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Déverrouiller l&apos;annonce
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 1 }}>
            {ad.title}
          </Typography>

          {/* Balance + cost info */}
          {currentUser && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                mb: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  borderRadius: 2.5,
                  px: 2,
                  py: 1,
                  background: (t) => t.palette.gradient?.primary135 ?? `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
                  boxShadow: '0 4px 14px rgba(246,71,95,0.25)',
                }}
              >
                <AccountBalanceWallet sx={{ fontSize: 20, color: '#fff' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Votre solde
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2 }}>
                    {currentBalance} crédit{currentBalance > 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  borderRadius: 2.5,
                  px: 2,
                  py: 1,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <Lock sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Coût
                  </Typography>
                  <Typography variant="body1" fontWeight={800} color="text.primary">
                    {unlockState?.required_points ?? ad.unlock_cost ?? '—'} crédits
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {paymentError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{paymentError}</Alert>}

          {/* Animated state transitions */}
          <AnimatePresence mode="wait">
            {isPaymentLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ py: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <AppLoader size={48} />
                  <Typography variant="caption" color="text.secondary">Traitement en cours…</Typography>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key={unlockState?.status === 'insufficient_points' ? 'insufficient' : confirmStep ? 'confirm' : 'init'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {/* Show packages when balance is insufficient */}
                {unlockState?.status === 'insufficient_points' ? (
                  <Box sx={{ textAlign: 'left' }}>
                    {(() => {
                      const requiredPoints = unlockState.required_points ?? 0;
                      const balancePoints = unlockState.current_balance ?? 0;
                      return (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                      Solde insuffisant — il vous faut <strong>{requiredPoints} crédit{requiredPoints > 1 ? 's' : ''}</strong> pour débloquer cette annonce.
                      {balancePoints > 0
                        ? ` Vous avez ${balancePoints} crédit${balancePoints > 1 ? 's' : ''}.`
                        : ' Rechargez votre solde pour continuer.'}
                    </Alert>
                      );
                    })()}

                    {unlockState.packages && unlockState.packages.length > 0 ? (
                      <>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                          Choisissez un pack de crédits
                        </Typography>
                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                          {[...unlockState.packages]
                            .sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0))
                            .map((pkg) => {
                            const requiredPoints = unlockState.required_points ?? 0;
                            const wouldBeEnough = (pkg.points_awarded ?? 0) >= requiredPoints;
                            return (
                              <Grid key={pkg.id} size={{ xs: 12, sm: 6, lg: pkg.is_popular ? 12 : 4 }}>
                                <PackageCard
                                  pkg={pkg}
                                  loading={isPackageLoading === pkg.id}
                                  onPurchase={handlePurchasePackage}
                                  wouldBeEnough={wouldBeEnough}
                                />
                              </Grid>
                            );
                          })}
                        </Grid>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aucun pack disponible pour le moment. Veuillez réessayer ultérieurement.
                      </Typography>
                    )}
                  </Box>
                ) : confirmStep ? (
                  <>
                    <Alert severity="info" icon={false} sx={{ mb: 2.5, borderRadius: 2, textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Confirmer le déverrouillage
                      </Typography>
                      <Typography variant="body2">
                        <strong>{unlockState?.required_points ?? ad.unlock_cost ?? '—'} crédits</strong> seront déduits
                        de votre solde. Cette action est irréversible.
                      </Typography>
                    </Alert>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleUnlock}
                      disabled={isPaymentLoading}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        mb: 1,
                        borderRadius: 2.5,
                        background: (theme) => theme.palette.gradient?.primary ?? 'linear-gradient(to right, #F6475F, #D93A50)',
                        '&:hover': { background: (theme) => theme.palette.gradient?.primaryHover ?? 'linear-gradient(to right, #E03E54, #C53248)' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      Confirmer
                    </Button>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={() => setConfirmStep(false)}
                      sx={{ color: 'text.secondary', borderRadius: 2.5 }}
                    >
                      Retour
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Vous aurez accès aux coordonnées de l&apos;annonceur (téléphone, email).
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 3 }}>
                       Plus de 200 annonces déverrouillées cette semaine
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={() => setConfirmStep(true)}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        mb: 1,
                        borderRadius: 2.5,
                        background: (theme) => theme.palette.gradient?.primary ?? 'linear-gradient(to right, #F6475F, #D93A50)',
                        '&:hover': { background: (theme) => theme.palette.gradient?.primaryHover ?? 'linear-gradient(to right, #E03E54, #C53248)' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      Déverrouiller
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            fullWidth
            variant="text"
            onClick={() => { setPaymentDialogOpen(false); setUnlockState(null); setPaymentError(''); setConfirmStep(false); }}
            sx={{ color: 'text.secondary', mt: 1, borderRadius: 2.5 }}
          >
            Annuler
          </Button>
        </Box>
      </Dialog>

      <AdReportModal
        adId={ad.id}
        open={reportModalOpen}
        submitting={isSubmittingReport}
        serverError={reportError}
        onClose={() => setReportModalOpen(false)}
        onSubmittingChange={setIsSubmittingReport}
        onServerErrorChange={setReportError}
        onSuccess={() => setSnackbar('Signalement envoye. Merci pour votre vigilance.')}
      />

      {/* 3D Tour fullscreen viewer */}
      {showTour && ad.tour_config && (
        <TourViewer
          tourConfig={ad.tour_config}
          onClose={() => setShowTour(false)}
        />
      )}

      {/* Lightbox — Airbnb-style fullscreen with swipe, zoom, thumbnails */}
      <ImageLightbox
        images={images}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Sticky mobile contact bar */}
      {ad && (
        <StickyPropertyBar
          price={ad.price ?? 0}
          title={ad.title}
          onContact={() => {
            if (isLocked) {
              setPaymentDialogOpen(true);
            } else {
              document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          whatsappUrl={!isLocked && publisherHasWhatsApp && whatsappNumber
            ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour,\n\nJe vous contacte suite à votre annonce *${ad.title}* que j'ai vue sur KeyHome.\n\nJe suis intéressé(e) par ce bien et souhaiterais avoir plus d'informations.\n\nCordialement${currentUser?.firstname ? `, ${currentUser.firstname}` : ''}`)}`
            : undefined}
          phoneUrl={!isLocked && publisherPhone ? `tel:${publisherPhone}` : undefined}
        />
      )}

      {/* Similar ads — bottom section (hidden on xl, shown in sidebar instead) */}
      <Container
        maxWidth="xl"
        sx={{
          pb: { xs: 14, md: 6 },
          display: { xs: 'block', md: 'block', lg: 'block', xl: 'none' },
        }}
      >
        <SimilarAds currentAdId={adId} />
      </Container>

      {ad && (
        <CompareDrawer
          currentAd={ad}
          open={compareDrawerOpen}
          onClose={() => setCompareDrawerOpen(false)}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3500}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          content: { 'aria-live': 'polite', role: 'status' as const } as Record<string, unknown>,
        }}
      />
    </>
  );
}

export default function AdDetailClient() {
  return (
    <Suspense fallback={<AppLoader />}>
      <AdDetailContent />
    </Suspense>
  );
}
