'use client';

import PaymentFlow from '@/components/payment/PaymentFlow';
import PackageCard from '@/components/ui/PackageCard';
import { Price } from '@/components/ui/Price';
import { ShimmerBox } from '@/components/ui/ShimmerCard';
import { creditsService } from '@/services/credits.service';
import { PaymentType, type PointPackage } from '@/types';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Close from '@mui/icons-material/Close';
import CreditCard from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import Toll from '@mui/icons-material/Toll';
import {
  Box,
  Dialog,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface PurchaseCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PurchaseCreditsModal({
  open,
  onClose,
}: PurchaseCreditsModalProps) {
  // Track which pack the user clicked. While non-null, <PaymentModal> is
  // mounted on top of this dialog and drives the actual gateway selection.
  const [pendingPkg, setPendingPkg] = useState<PointPackage | null>(null);
  const [pkgError, setPkgError] = useState('');
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    refetchInterval: (query) =>
      query.state.status === 'error' ? false : 30_000,
    staleTime: 15_000,
    enabled: open,
    retry: false,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['credits-packages'],
    queryFn: () => creditsService.getPackages(),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const availableCredits = balance ?? 0;
  const creditsLabel =
    availableCredits > 1 ? 'crédits disponibles' : 'crédit disponible';

  // Step 1 : user picks a pack — we DON'T initiate the payment yet. The
  // <PaymentModal> is mounted next, lets the user choose a method (mobile
  // money / card) and only THEN does the backend route through the right
  // gateway via `PaymentMethod::gateway()`.
  const handlePurchase = (pkg: PointPackage) => {
    setPkgError('');
    setPendingPkg(pkg);
  };

  // Step 2 : the user closed the payment modal without paying. Drop the
  // pending pack and stay on the catalogue so they can retry or pick another.
  const handlePaymentModalClose = () => {
    setPendingPkg(null);
  };

  // Step 3 : payment confirmed (Stripe `confirmPayment` succeeded + the
  // server-side verify call returned `is_paid=true`). We :
  //  1. Refresh the cached balance so the header reflects the new credits.
  //  2. Show the "Paiement confirmé" state for ~1.8 s so the user has
  //     visual confirmation, then auto-close — matching the Flutterwave
  //     callback experience (user lands back on the page with credits
  //     already visible in the header pill).
  //
  // Flutterwave success is handled separately by the callback page after
  // the user returns from the hosted checkout — this handler is Stripe-only
  // in practice.
  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
    setTimeout(() => {
      setPendingPkg(null);
      onClose();
    }, 1800);
  };

  const handleClose = () => {
    setPkgError('');
    setPendingPkg(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 5,
          // If the content ever exceeds the dialog height, we scroll the
          // WHOLE modal as one block (header + body + footer together)
          // rather than scrolling the body alone. Matches the user ask :
          // "les cards des packs et le formulaire stripe doivent être
          // fix et non scrollable" — the cards/form never scroll inside.
          overflow: 'auto',
          maxHeight: isMobile ? '100vh' : '95vh',
          background: 'transparent',
          boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.28)',
          // Hide the scrollbar for a clean look (accessibility : keyboard
          // scroll still works — just the visual thumb is removed).
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
      }}
    >
      {/* ── HEADER (navy gradient, premium fintech aesthetic) ─────────── */}
      <Box
        sx={{
          position: 'relative',
          px: { xs: 2.5, sm: 4 },
          pt: { xs: 3, sm: 4.5 },
          pb: { xs: 2.5, sm: 4 },
          // Deep navy gradient inspired by premium fintech apps (Revolut,
          // Stripe, N26). The brand crimson is used sparingly as an accent
          // further down, not as the dominant colour — more sober.
          background:
            'linear-gradient(135deg, #0A1628 0%, #132138 55%, #0D1F3C 100%)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Soft crimson glow in the corner — ties the header to the brand
            without overwhelming the composition. */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(246,71,95,0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Cool accent glow on the opposite corner for visual balance. */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <IconButton
          aria-label="Fermer"
          onClick={handleClose}
          size="small"
          sx={{
            position: 'absolute',
            top: { xs: 8, sm: 12 },
            right: { xs: 8, sm: 12 },
            color: 'rgba(255,255,255,0.55)',
            bgcolor: 'rgba(255,255,255,0.04)',
            width: 32,
            height: 32,
            '&:hover': {
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.12)',
            },
          }}
        >
          <Close sx={{ fontSize: 18 }} />
        </IconButton>

        {pendingPkg && (
          <IconButton
            aria-label="Retour aux packs"
            onClick={handlePaymentModalClose}
            size="small"
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: 12 },
              left: { xs: 8, sm: 12 },
              color: 'rgba(255,255,255,0.55)',
              bgcolor: 'rgba(255,255,255,0.04)',
              width: 32,
              height: 32,
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {pendingPkg ? (
          // ── Compact header for the payment step ─────────────────────
          <Box sx={{ pt: { xs: 0.5, sm: 1 }, position: 'relative', zIndex: 1 }}>
            {/* Crimson-tinted icon circle — ties to brand subtly. */}
            <Box
              sx={{
                width: { xs: 44, sm: 52 },
                height: { xs: 44, sm: 52 },
                borderRadius: '50%',
                bgcolor: 'rgba(246,71,95,0.14)',
                border: '1px solid rgba(246,71,95,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <CreditCard
                sx={{
                  color: '#F6475F',
                  fontSize: { xs: 20, sm: 24 },
                }}
              />
            </Box>

            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 2,
                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                fontWeight: 700,
                mb: 0.75,
              }}
            >
              Étape 2 sur 2 · Paiement
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontWeight: 600,
                lineHeight: 1.25,
                mb: 0.75,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                letterSpacing: -0.2,
              }}
            >
              {pendingPkg.name}
            </Typography>
            <Box
              component="div"
              sx={{
                color: '#fff',
                fontWeight: 800,
                letterSpacing: -1.2,
                fontSize: { xs: '1.75rem', sm: '2.1rem' },
                lineHeight: 1.1,
                fontFamily: 'inherit',
                // Display the visitor's LOCAL currency (what Stripe will
                // actually charge — e.g. 1.40 CHF / 1.52 EUR) in the hero
                // position, with the XAF canonical value rendered as a
                // small subtitle. The <Price primary="local" showOriginal>
                // component injects the XAF line inside a nested <Box>
                // styled `color: text.secondary` (dark grey, unreadable
                // on our navy background) — we override every descendant
                // so the XAF subtitle is visible and proportionate.
                '& > span > span:first-of-type': {
                  display: 'block',
                  lineHeight: 1.05,
                },
                '& > span > .MuiBox-root, & > span > span + span': {
                  color: 'rgba(255,255,255,0.55) !important',
                  fontSize: '0.45em !important',
                  fontWeight: 500,
                  letterSpacing: 0,
                  mt: '6px !important',
                },
              }}
            >
              <Price
                amountXAF={pendingPkg.price}
                primary="local"
                showOriginal
              />
            </Box>
            <Typography
              sx={{
                mt: 1.5,
                color: 'rgba(255,255,255,0.6)',
                fontSize: { xs: '0.7rem', sm: '0.78rem' },
                fontWeight: 500,
              }}
            >
              {pendingPkg.points_awarded.toLocaleString('fr-FR')}{' '}
              {pendingPkg.points_awarded > 1 ? 'crédits' : 'crédit'} seront
              ajoutés à votre compte
            </Typography>
          </Box>
        ) : (
          // ── Landing header (pack catalogue) ─────────────────────────
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Overline label — sober, uppercase, letter-spaced. */}
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: 2,
                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                fontWeight: 700,
                mb: { xs: 1, sm: 1.25 },
              }}
            >
              Votre solde
            </Typography>

            {/* Hero balance — white with crimson accent on the number. */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 1,
                mb: 0.5,
              }}
            >
              {balanceLoading ? (
                <ShimmerBox
                  width={88}
                  height={48}
                  borderRadius={8}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '&::after': {
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                    },
                  }}
                />
              ) : (
                <>
                  <Toll
                    sx={{
                      fontSize: { xs: 22, sm: 26 },
                      color: '#F6475F',
                      mb: { xs: 0.4, sm: 0.5 },
                    }}
                  />
                  <Typography
                    component="span"
                    sx={{
                      color: '#fff',
                      fontWeight: 800,
                      letterSpacing: -2,
                      fontSize: { xs: '2.4rem', sm: '3rem' },
                      lineHeight: 1,
                    }}
                  >
                    {availableCredits.toLocaleString('fr-FR')}
                  </Typography>
                </>
              )}
            </Box>

            <Typography
              sx={{
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 500,
                letterSpacing: 0.2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                mb: { xs: 1.75, sm: 2.25 },
              }}
            >
              {balanceLoading ? 'crédits disponibles' : creditsLabel}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── BODY (packs grid OR payment flow) ─────────────────────────── */}
      {/* No internal scroll: the Dialog grows to fit its content. Packs are
          compact enough to fit in 95vh even on the shortest laptops (720p)
          and the payment form is fixed-height. On very tall content we
          rely on the Dialog-level overflow to let the whole modal scroll
          as a single block — never the body alone. */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          pb: 2.5,
          bgcolor: 'background.paper',
          overflow: 'visible',
        }}
      >
        {pendingPkg ? (
          <PaymentFlow
            amount={pendingPkg.price}
            type={PaymentType.CREDIT}
            planId={pendingPkg.id}
            onSuccess={handlePaymentSuccess}
            onBack={handlePaymentModalClose}
          />
        ) : (
          <>
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                letterSpacing: 1.5,
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            >
              Choisir un pack
            </Typography>

            {pkgError && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: 'block', mt: 1, mb: 0.5 }}
              >
                {pkgError}
              </Typography>
            )}

            <AnimatePresence mode="wait">
              {packagesLoading ? (
                <Grid key="loading" container spacing={2} sx={{ mt: 1.5 }}>
                  {[1, 2, 3].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          height: 220,
                        }}
                      >
                        <ShimmerBox height={220} borderRadius={16} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : packages && packages.length > 0 ? (
                <Grid key="packages" container spacing={2} sx={{ mt: 1.5 }}>
                  {packages.map((pkg, idx) => (
                    <Grid
                      key={pkg.id}
                      size={{ xs: 12, sm: 6, md: 4 }}
                      component={motion.div}
                      initial={{ opacity: 0, y: 24, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.38,
                        delay: idx * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <PackageCard
                        pkg={pkg}
                        loading={false}
                        onPurchase={handlePurchase}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box key="empty" sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun pack disponible pour le moment.
                  </Typography>
                </Box>
              )}
            </AnimatePresence>
          </>
        )}
      </Box>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
        }}
      >
        <LockIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            lineHeight: 1.5,
            textAlign: 'center',
            fontSize: '0.7rem',
          }}
        >
          Les crédits permettent de déverrouiller les coordonnées des
          annonceurs.
        </Typography>
      </Box>
    </Dialog>
  );
}
