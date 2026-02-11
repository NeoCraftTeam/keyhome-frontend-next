'use client';

import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Avatar,
  Dialog,
  IconButton,
  Alert,
  Skeleton,
  Paper,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  BedOutlined,
  BathtubOutlined,
  SquareFootOutlined,
  LocalParking,
  LocationOn,
  Lock,
  LockOpen,
  Close,
  ChevronLeft,
  ChevronRight,
  Share,
  FavoriteBorder,
  Favorite,
  Verified,
  Phone,
  Email,
  ContentCopy,
} from '@mui/icons-material';
import { adsService } from '@/services/ads.service';
import { paymentsService } from '@/services/payments.service';
import { formatPrice, formatRelativeDate } from '@/lib/constants';
import FadeIn from '@/components/ui/FadeIn';

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
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: ad, isLoading } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => adsService.show(adId),
    enabled: !!adId,
  });

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

  const images = ad.images || [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const isLocked = ad.is_unlocked === false && !justUnlocked;

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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPaymentError(axiosErr?.response?.data?.message || 'Erreur lors du paiement.');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const openLightbox = (idx: number) => {
    if (isLocked && idx > 0) return;
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

  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Image gallery — Airbnb grid */}
        <FadeIn delay={0.1} direction="none">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gridTemplateRows: { md: '200px 200px' },
            gap: 0.5,
            borderRadius: 3,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          {/* Main image */}
          <Box
            onClick={() => openLightbox(0)}
            sx={{
              gridRow: { md: '1 / 3' },
              position: 'relative',
              cursor: 'pointer',
              minHeight: { xs: 250, md: 'auto' },
              '&:hover': { opacity: 0.92 },
              transition: 'opacity 0.2s',
            }}
          >
            {primaryImage ? (
              <Box
                component="img"
                src={primaryImage.url}
                alt={ad.title}
                loading="eager"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                display: { xs: idx > 0 ? 'none' : 'block', md: 'block' },
                position: 'relative',
                cursor: isLocked ? 'default' : 'pointer',
                '&:hover': isLocked ? {} : { opacity: 0.92 },
                transition: 'opacity 0.2s',
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
                  filter: isLocked ? 'blur(20px)' : 'none',
                  transition: 'filter 0.3s',
                }}
              />
              {isLocked && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <Lock sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
              )}
            </Box>
          ))}
        </Box>
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
            startIcon={isFavorite ? <Favorite sx={{ color: '#F6475F' }} /> : <FavoriteBorder />}
            onClick={() => setIsFavorite(!isFavorite)}
            sx={{ borderRadius: '20px', textTransform: 'none', borderColor: 'divider', color: isFavorite ? '#F6475F' : 'text.primary' }}
          >
            {isFavorite ? 'Sauvegardé' : 'Sauvegarder'}
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

            {/* Contact info — blur if locked */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                mb: 3,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Coordonnées de l&apos;annonceur
              </Typography>

              {isLocked ? (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ filter: 'blur(8px)', userSelect: 'none', pointerEvents: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">+237 6XX XXX XXX</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">email@example.com</Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Lock />}
                      onClick={() => setPaymentDialogOpen(true)}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(to right, #F6475F, #D93A50)',
                        '&:hover': { background: 'linear-gradient(to right, #E03E54, #C53248)' },
                      }}
                    >
                      Déverrouiller pour voir
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {publisherPhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">{publisherPhone}</Typography>
                      <IconButton size="small" onClick={() => { navigator.clipboard.writeText(publisherPhone); setSnackbar('Numéro copié'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                  {publisherEmail && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2">{publisherEmail}</Typography>
                      <IconButton size="small" onClick={() => { navigator.clipboard.writeText(publisherEmail); setSnackbar('Email copié'); }}>
                        <ContentCopy sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {/* Description */}
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 3, lineHeight: 1.8 }}>
              {ad.description}
            </Typography>
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
                  Déverrouiller — 500 FCFA
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<LockOpen />}
                  disabled
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    bgcolor: 'success.main',
                    '&.Mui-disabled': { bgcolor: 'success.main', color: '#fff', opacity: 0.9 },
                  }}
                >
                  Annonce déverrouillée
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                {isLocked ? 'Payez pour voir les coordonnées et toutes les photos' : 'Vous avez accès à toutes les informations'}
              </Typography>
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
            500 FCFA
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Vous aurez accès aux coordonnées de l&apos;annonceur et à toutes les photos de l&apos;annonce.
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
                sx={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', filter: isLocked && lightboxIndex > 0 ? 'blur(20px)' : 'none' }}
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
