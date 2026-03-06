'use client';

import PropertyAttributes from '@/components/ads/PropertyAttributes';
import StickyPropertyBar from '@/components/ads/StickyPropertyBar';
import ReviewForm from '@/components/reviews/ReviewForm';
import PackageCard from '@/components/ui/PackageCard';
import ViewingBookingPanel from '@/components/viewing/ViewingBookingPanel';
import QueryError from '@/components/ui/QueryError';
import FadeIn from '@/components/ui/FadeIn';
import { formatPrice, formatRelativeDate } from '@/lib/constants';
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
  BathtubOutlined,
  BedOutlined,
  CalendarMonth,
  Call,
  ChevronLeft,
  ChevronRight,
  Close,
  ContentCopy,
  Description,
  Email,
  Favorite,
  FavoriteBorder,
  LocalParking,
  LocationOn,
  Lock,
  Phone,
  ReceiptLong,
  Share,
  SquareFootOutlined,
  Star,
  Verified,
  WhatsApp,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function AdDetailContent() {
  const params = useParams();
  const router = useRouter();
  const adId = params.id as string;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPackageLoading, setIsPackageLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [unlockState, setUnlockState] = useState<UnlockResponse | null>(null);
  const [confirmStep, setConfirmStep] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const { user: currentUser, refreshUser, isAuthenticated } = useAuth();
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
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
    }
  }, [adId, queryClient]);

  // Track view once per page load — feeds the recommendation engine.
  useEffect(() => {
    if (adId && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      adsService.trackView(adId);
    }
  }, [adId]);

  const { data: ad, isLoading, isError, refetch } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => adsService.show(adId),
    enabled: !!adId,
  });

  const { data: unlockCostData } = useQuery({
    queryKey: ['unlock-cost'],
    queryFn: () => paymentsService.getUnlockCost(),
    staleTime: 5 * 60_000,
  });

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
    setPaymentError('');
    setUnlockState(null);
    setIsPaymentLoading(true);
    try {
      const response = await paymentsService.initialize(ad.id);
      setUnlockState(response);
      if (response.status === 'unlocked') {
        // Refresh the ad to show unlocked content
        await queryClient.invalidateQueries({ queryKey: ['ad', adId] });
        // Refresh balance in AuthContext and Navbar widget
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
        setPaymentDialogOpen(false);
        setSnackbar('Annonce déverrouillée avec succès !');
      }
      // For 'insufficient_points' → modal stays open and shows packages
    } catch (err) {
      setPaymentError(getSafeErrorMessage(err, 'Erreur lors du déverrouillage.'));
    } finally {
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
    setLightboxZoom(1);
    setLightboxOpen(true);
  };

  const changeLightboxImage = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxZoom(1);
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

  // Format phone number for WhatsApp (remove spaces, dashes, etc.)
  const whatsappNumber = publisherPhone?.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Back navigation */}
        <Button
          onClick={() => router.back()}
          startIcon={<ChevronLeft />}
          sx={{
            mb: 1.5,
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Retour aux annonces
        </Button>

        {/* Image gallery */}
        <FadeIn delay={0.1} direction="none">

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
                src={primaryImage.url}
                alt={ad.title}
                fill
                priority
                sizes="100vw"
                style={{
                  objectFit: 'cover',
                  filter: 'blur(1px) brightness(0.92)',
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
                  src={primaryImage.url}
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
                  src={img.url}
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
                    bgcolor: 'rgba(255,255,255,0.95)',
                    color: 'text.primary',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: '#fff' },
                  }}
                >
                  Voir les {images.length} photos
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Mobile image count + tap to view */}
        {images.length > 1 && (
          <Box
            onClick={() => openLightbox(0)}
            sx={{
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center',
              mt: -2,
              mb: 2,
            }}
          >
            <Chip
              label={`Voir les ${images.length} photos`}
              size="small"
              clickable
              sx={{
                fontWeight: 600,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            />
          </Box>
        )}
        </FadeIn>

        {/* Action buttons */}
        <FadeIn delay={0.2} direction="up">
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
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
            startIcon={checkFav(ad.id) ? <Favorite sx={{ color: '#F6475F' }} /> : <FavoriteBorder />}
            onClick={() => toggleFav(ad)}
            sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: checkFav(ad.id) ? '#F6475F' : 'text.primary' }}
          >
            {checkFav(ad.id) ? 'Sauvegardé' : 'Sauvegarder'}
          </Button>
        </Box>
        </FadeIn>

        <FadeIn delay={0.3} direction="up">
        <Grid container spacing={4}>
          {/* Left column — details */}
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              {ad.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, mb: 2, flexWrap: 'wrap' }}>
              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {ad.quarter?.name}
                {ad.quarter?.city_name ? `, ${ad.quarter.city_name}` : ''}
                {ad.adresse ? ` — ${ad.adresse}` : ''}
              </Typography>
            </Box>

            {/* Features pills */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {features.map((f, idx) => (
                <Chip key={idx} icon={f.icon as React.ReactElement} label={f.label} variant="outlined" sx={{ borderRadius: 2 }} />
              ))}
              {ad.type && <Chip label={ad.type.name} color="primary" variant="outlined" sx={{ borderRadius: 2 }} />}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Publisher info — blurred if locked */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar src={ad.user?.avatar || undefined} sx={{ width: 48, height: 48 }}>
                {publisherName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Publié par {publisherName}
                  </Typography>
                  <Verified sx={{ fontSize: 16, color: 'primary.main' }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeDate(ad.created_at)}
                </Typography>
              </Box>
            </Box>

            {/* Premium Info Section - Only when unlocked */}
            {!isLocked && (ad.deposit_amount || ad.minimum_lease_duration || ad.detailed_charges || ad.property_condition_pdf) && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  mb: 3,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.08)' : 'rgba(246,71,95,0.04)',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(246,71,95,0.25)' : 'rgba(246,71,95,0.18)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Star sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: -0.3 }}>
                    Informations Premium
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  {ad.deposit_amount && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountBalanceWallet sx={{ fontSize: 24, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Dépôt de garantie
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {ad.deposit_amount}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {ad.minimum_lease_duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarMonth sx={{ fontSize: 24, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Durée minimum
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {ad.minimum_lease_duration}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {ad.detailed_charges && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, gridColumn: { sm: ad.property_condition_pdf ? 'auto' : '1 / -1' } }}>
                      <ReceiptLong sx={{ fontSize: 24, color: 'text.secondary', mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          Charges
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ whiteSpace: 'pre-line' }}>
                          {ad.detailed_charges}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {ad.property_condition_pdf && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Description sx={{ fontSize: 24, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                          État des lieux
                        </Typography>
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
                          Télécharger le PDF
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Property Attributes */}
            {ad.attributes && ad.attributes.length > 0 && (
              <>
                <PropertyAttributes attributes={ad.attributes} variant="list" showTitle />
                <Divider sx={{ my: 3 }} />
              </>
            )}

            {/* Description */}
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 3, lineHeight: 1.8 }}>
              {ad.description}
            </Typography>

            {/* Reviews & ratings */}
            {ad.reviews && ad.reviews.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>Avis</Typography>
                  {ad.rating != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Box key={s} component="span" sx={{ color: s <= Math.round(ad.rating!) ? '#FFB400' : '#E0E0E0', fontSize: 18, lineHeight: 1 }}>★</Box>
                      ))}
                      <Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>
                        {ad.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({ad.reviews_count} avis)
                      </Typography>
                    </Box>
                  )}
                </Box>
                {ad.reviews.map((review) => (
                  <Paper key={review.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}
                        src={review.user?.avatar || undefined}
                      >
                        {review.user?.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                          {review.user?.name || 'Utilisateur'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeDate(review.created_at)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Box key={s} component="span" sx={{ color: s <= review.rating ? '#FFB400' : '#E0E0E0', fontSize: 14 }}>★</Box>
                        ))}
                      </Box>
                    </Box>
                    {review.comment && (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, pl: 5.5 }}>
                        {review.comment}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}

            {/* Review submission form */}
            <ReviewForm
              adId={ad.id}
              hasUserReviewed={!!(currentUser && ad.reviews?.some(r => r.user?.id === currentUser.id))}
            />
          </Grid>

          {/* Right column — pricing card */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Paper
              elevation={0}
              sx={{
                position: { md: 'sticky' },
                top: { md: 80 },
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {features.map((f, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: 'text.secondary' }}>{f.icon}</Box>
                    <Typography variant="body2">{f.label}</Typography>
                  </Box>
                ))}
              </Box>

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
                      background: 'linear-gradient(to right, #F6475F, #D93A50)',
                      '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
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
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Contact de l&apos;annonceur
                  </Typography>
                  {publisherPhone && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Phone sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>{publisherPhone}</Typography>
                        <IconButton size="small" aria-label="Copier le numéro" onClick={() => { navigator.clipboard.writeText(publisherPhone); setSnackbar('Numéro copié'); }}>
                          <ContentCopy sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                            WhatsApp
                          </Button>
                        )}
                      </Box>
                    </Box>
                  )}
                  {publisherEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>{publisherEmail}</Typography>
                      <IconButton size="small" aria-label="Copier l'email" onClick={() => { navigator.clipboard.writeText(publisherEmail); setSnackbar('Email copié'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}

                  {/* Viewing appointment booking — only when unlocked */}
                  <Divider sx={{ mt: 2.5, mb: 0 }} />
                  <ViewingBookingPanel adId={ad.id} adTitle={ad.title} />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        </FadeIn>
      </Container>

      {/* Unlock / Credits dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => { setPaymentDialogOpen(false); setUnlockState(null); setPaymentError(''); setConfirmStep(false); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Déverrouiller l&apos;annonce
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
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
                mb: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Typography variant="body2" color="text.secondary">Solde :</Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={(unlockState?.current_balance ?? currentUser.point_balance ?? 0) > 0 ? 'primary.main' : 'error.main'}
                >
                  {unlockState?.current_balance ?? currentUser.point_balance ?? 0} crédits
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Typography variant="body2" color="text.secondary">Coût :</Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {unlockState?.required_points ?? unlockCostData?.unlock_cost_points ?? '—'} crédits
                </Typography>
              </Box>
            </Box>
          )}

          {paymentError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{paymentError}</Alert>}

          {/* Show packages when balance is insufficient */}
          {unlockState?.status === 'insufficient_points' ? (
            <Box sx={{ textAlign: 'left' }}>
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                Solde insuffisant — il vous faut <strong>{unlockState.required_points} crédits</strong> pour débloquer cette annonce.
                {(unlockState.current_balance ?? 0) > 0
                  ? ` Vous avez ${unlockState.current_balance} crédits.`
                  : ' Rechargez votre solde pour continuer.'}
              </Alert>

              {unlockState.packages && unlockState.packages.length > 0 ? (
                <>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
                    Choisissez un pack de crédits
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    {unlockState.packages.map((pkg) => {
                      const wouldBeEnough = (unlockState.current_balance ?? 0) + pkg.points_awarded >= (unlockState.required_points ?? 0);
                      return (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          loading={isPackageLoading === pkg.id}
                          onPurchase={handlePurchasePackage}
                          wouldBeEnough={wouldBeEnough}
                        />
                      );
                    })}
                  </Box>
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
                  <strong>{unlockState?.required_points ?? unlockCostData?.unlock_cost_points ?? '—'} crédits</strong> seront déduits
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
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                  '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                {isPaymentLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Confirmer'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => setConfirmStep(false)}
                disabled={isPaymentLoading}
                sx={{ color: 'text.secondary' }}
              >
                Retour
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Vous aurez accès aux coordonnées de l&apos;annonceur (téléphone, email).
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
                🔓 Plus de 200 annonces déverrouillées cette semaine
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
                  background: 'linear-gradient(to right, #F6475F, #D93A50)',
                  '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                  '&:active': { transform: 'scale(0.97)' },
                }}
              >
                Déverrouiller
              </Button>
            </>
          )}

          <Button
            fullWidth
            variant="text"
            onClick={() => { setPaymentDialogOpen(false); setUnlockState(null); setPaymentError(''); setConfirmStep(false); }}
            sx={{ color: 'text.secondary', mt: 0.5 }}
          >
            Annuler
          </Button>
        </Box>
      </Dialog>

      {/* Lightbox — fullscreen with zoom, transparent paper */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        fullScreen
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') changeLightboxImage((lightboxIndex - 1 + images.length) % images.length);
          else if (e.key === 'ArrowRight') changeLightboxImage((lightboxIndex + 1) % images.length);
          else if (e.key === 'Escape') setLightboxOpen(false);
          else if (e.key === '+' || e.key === '=') setLightboxZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))));
          else if (e.key === '-') setLightboxZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
        }}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(8,8,8,0.93)' } } }}
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1.5, sm: 2 },
            py: 1,
            bgcolor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {lightboxIndex + 1} / {images.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              aria-label="Dézoomer"
              onClick={() => setLightboxZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
              disabled={lightboxZoom <= 0.5}
              sx={{ color: '#fff', opacity: lightboxZoom <= 0.5 ? 0.3 : 1 }}
            >
              <ZoomOut />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#fff', minWidth: 36, textAlign: 'center', userSelect: 'none' }}>
              {Math.round(lightboxZoom * 100)}%
            </Typography>
            <IconButton
              size="small"
              aria-label="Zoomer"
              onClick={() => setLightboxZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
              disabled={lightboxZoom >= 4}
              sx={{ color: '#fff', opacity: lightboxZoom >= 4 ? 0.3 : 1 }}
            >
              <ZoomIn />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setLightboxZoom(1)}
              aria-label="Réinitialiser le zoom"
              title="Réinitialiser"
              sx={{ color: 'rgba(255,255,255,0.65)', ml: 0.5 }}
            >
              <ZoomOutMap sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton aria-label="Fermer la visionneuse" onClick={() => setLightboxOpen(false)} sx={{ color: '#fff', ml: 0.5 }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Image area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: lightboxZoom >= 3 ? 'zoom-out' : 'zoom-in',
          }}
          onClick={() => {
            if (lightboxZoom < 3) {
              setLightboxZoom((z) => parseFloat((z + 0.5).toFixed(2)));
            } else {
              setLightboxZoom(1);
            }
          }}
        >
          {/* Prev */}
          <IconButton
            aria-label="Photo précédente"
            onClick={(e) => { e.stopPropagation(); changeLightboxImage((lightboxIndex - 1 + images.length) % images.length); }}
            sx={{
              color: '#fff',
              position: 'absolute',
              left: { xs: 4, sm: 16 },
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.35)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>

          {images.length > 0 && (
            <Box
              component="img"
              src={images[lightboxIndex]?.url}
              alt={`Photo ${lightboxIndex + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 60px)',
                objectFit: 'contain',
                transform: `scale(${lightboxZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.22s ease',
                borderRadius: lightboxZoom <= 1 ? 2 : 0,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Next */}
          <IconButton
            aria-label="Photo suivante"
            onClick={(e) => { e.stopPropagation(); changeLightboxImage((lightboxIndex + 1) % images.length); }}
            sx={{
              color: '#fff',
              position: 'absolute',
              right: { xs: 4, sm: 16 },
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.35)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
      </Dialog>

      {/* Sticky mobile contact bar */}
      {ad && (
        <StickyPropertyBar
          price={ad.price ?? 0}
          title={ad.title}
          onContact={() => {
            if (isLocked) {
              setPaymentDialogOpen(true);
            } else if (publisherPhone) {
              window.location.href = `tel:${publisherPhone}`;
            }
          }}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={2500}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

export default function AdDetailClient() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress /></Box>}>
      <AdDetailContent />
    </Suspense>
  );
}
