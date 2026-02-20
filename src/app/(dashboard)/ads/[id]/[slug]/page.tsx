'use client';

import PropertyAttributes from '@/components/ads/PropertyAttributes';
import ReviewForm from '@/components/reviews/ReviewForm';
import FadeIn from '@/components/ui/FadeIn';
import { formatPrice, formatRelativeDate } from '@/lib/constants';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/providers/AuthProvider';
import { useFavorites } from '@/providers/FavoritesProvider';
import { adsService } from '@/services/ads.service';
import { paymentsService } from '@/services/payments.service';
import {
  AccountBalanceWallet,
  BathtubOutlined,
  BedOutlined,
  Call,
  CalendarMonth,
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
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

function AdDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const adId = params.id as string;
  const justUnlocked = searchParams.get('unlocked') === '1';

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const { isFavorite: checkFav, toggleFavorite: toggleFav } = useFavorites();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (justUnlocked && adId && !verifiedRef.current) {
      verifiedRef.current = true;
      paymentsService.verify(adId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['ad', adId] });
      }).catch(() => {});
    }
  }, [justUnlocked, adId, queryClient]);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => adsService.show(adId),
    enabled: !!adId,
  });

  const { data: unlockPrice } = useQuery({
    queryKey: ['unlock-price'],
    queryFn: () => paymentsService.getUnlockPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const formattedUnlockPrice = unlockPrice ? `${unlockPrice.toLocaleString('fr-FR')} FCFA` : '...';

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
  const isLocked = ad.is_unlocked === false && !justUnlocked;
  // When locked, only show the primary image
  const images = isLocked ? (primaryImage ? [primaryImage] : []) : allImages;
  const totalImageCount = ad.total_images || allImages.length;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setSnackbar('Lien copié dans le presse-papier');
    } catch {
      setSnackbar('Impossible de copier le lien');
    }
  };

  const handleUnlock = async () => {
    setPaymentError('');
    setIsPaymentLoading(true);
    try {
      const response = await paymentsService.initialize(ad.id);
      window.location.href = response.payment_url;
    } catch (err) {
      setPaymentError(getSafeErrorMessage(err, 'Erreur lors du paiement.'));
    } finally {
      setIsPaymentLoading(false);
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

  // Format phone number for WhatsApp (remove spaces, dashes, etc.)
  const whatsappNumber = publisherPhone?.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Image gallery */}
        <FadeIn delay={0.1} direction="none">
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
            onClick={() => !isLocked && openLightbox(0)}
            sx={{
              gridRow: { md: !isLocked && images.length >= 3 ? '1 / 3' : !isLocked && images.length === 2 ? '1 / 3' : 'auto' },
              position: 'relative',
              cursor: isLocked ? 'default' : 'pointer',
              overflow: 'hidden',
              ...(!isLocked && { '&:hover img': { transform: 'scale(1.03)' } }),
            }}
          >
            {primaryImage ? (
              <Box
                component="img"
                src={primaryImage.url}
                alt={ad.title}
                loading="eager"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  ...(isLocked && { filter: 'blur(3px) brightness(0.7)' }),
                }}
              />
            ) : (
              <Box sx={{ width: '100%', height: '100%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Aucune photo</Typography>
              </Box>
            )}
            {/* Lock overlay on primary image when locked */}
            {isLocked && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 3,
                }}
              >
                <Lock sx={{ fontSize: 40, color: '#fff', mb: 1 }} />
                <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                  📷 {totalImageCount} photo{totalImageCount > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Déverrouillez pour toutes les voir
                </Typography>
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
              <Box
                component="img"
                src={img.url}
                alt={`${ad.title} ${idx + 2}`}
                loading="lazy"
                sx={{
                  width: '100%',
                  height: '100%',
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
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider',
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

              {paymentError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{paymentError}</Alert>}

              {isLocked ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => setPaymentDialogOpen(true)}
                    startIcon={<Lock />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      background: 'linear-gradient(to right, #F6475F, #D93A50)',
                      '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                    }}
                  >
                    Déverrouiller — {formattedUnlockPrice}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                    Payez pour accéder aux coordonnées de l&apos;annonceur
                  </Typography>
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
                        <IconButton size="small" onClick={() => { navigator.clipboard.writeText(publisherPhone); setSnackbar('Numéro copié'); }}>
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
                            borderRadius: 2,
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
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              bgcolor: '#25D366',
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
                      <IconButton size="small" onClick={() => { navigator.clipboard.writeText(publisherEmail); setSnackbar('Email copié'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        </FadeIn>
      </Container>

      {/* Payment confirmation dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Déverrouiller l&apos;annonce
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {ad.title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mb: 3 }}>
            {formattedUnlockPrice}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vous aurez accès aux coordonnées de l&apos;annonceur (téléphone, email).
          </Typography>

          {paymentError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{paymentError}</Alert>}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleUnlock}
            disabled={isPaymentLoading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              mb: 1,
              background: 'linear-gradient(to right, #F6475F, #D93A50)',
              '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
            }}
          >
            {isPaymentLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Payer avec FedaPay'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setPaymentDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Annuler
          </Button>
        </Box>
      </Dialog>

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#000', borderRadius: 3, maxHeight: '90vh' } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}>
            <Close />
          </IconButton>
          {images.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <IconButton onClick={() => setLightboxIndex((p) => (p - 1 + images.length) % images.length)} sx={{ color: '#fff', position: 'absolute', left: 8, zIndex: 2 }}>
                <ChevronLeft sx={{ fontSize: 32 }} />
              </IconButton>
              <Box
                component="img"
                src={images[lightboxIndex]?.url}
                alt={`Photo ${lightboxIndex + 1}`}
                sx={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }}
              />
              <IconButton onClick={() => setLightboxIndex((p) => (p + 1) % images.length)} sx={{ color: '#fff', position: 'absolute', right: 8, zIndex: 2 }}>
                <ChevronRight sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          )}
          <Typography variant="body2" sx={{ color: '#fff', textAlign: 'center', py: 1 }}>
            {lightboxIndex + 1} / {images.length}
          </Typography>
        </Box>
      </Dialog>

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

export default function AdDetailPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress /></Box>}>
      <AdDetailContent />
    </Suspense>
  );
}
