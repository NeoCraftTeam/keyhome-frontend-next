'use client';

import PaymentFlow from '@/components/payment/PaymentFlow';
import PackageCard from '@/components/ui/display/PackageCard';
import { Price } from '@/components/ui/typography/Price';
import { ShimmerBox } from '@/components/ui/feedback/ShimmerCard';
import { useTurnstileSiteKey } from '@/hooks/useTurnstileSiteKey';
import { API_URL } from '@/lib/api';
import {
  khSafeAreaBottomSx,
  khSafeAreaTopSx,
  syncKhSafeAreaInsets,
} from '@/lib/safe-area-insets';
import { creditsService } from '@/services/credits.service';
import { brand, brandAgent } from '@/theme/tokens';
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
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PurchaseCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PurchaseCreditsModal({
  open,
  onClose,
}: PurchaseCreditsModalProps) {
  /** After pack selection → PaymentFlow (Turnstile after payment method when enforced). */
  type CreditPhase = 'packs' | 'payment';

  const [phase, setPhase] = useState<CreditPhase>('packs');
  const [pendingPkg, setPendingPkg] = useState<PointPackage | null>(null);

  const [creditCaptchaConfig, setCreditCaptchaConfig] = useState<{
    loaded: boolean;
    showCreditsTurnstile: boolean;
    apiSiteKey: string | null;
  }>({
    loaded: false,
    showCreditsTurnstile: false,
    apiSiteKey: null,
  });

  const [pkgError, setPkgError] = useState('');
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const ownerShell = pathname === '/owner' || pathname?.startsWith('/owner/');

  const shellPrimary = ownerShell ? brandAgent.primary : brand.primary;

  const { siteKey: hookSiteKey, isResolved } = useTurnstileSiteKey();
  const turnstileWidgetSiteKey = creditCaptchaConfig.apiSiteKey ?? hookSiteKey;

  useEffect(() => {
    if (!open) {
      setPhase('packs');
      setPendingPkg(null);
      setCreditCaptchaConfig({
        loaded: false,
        showCreditsTurnstile: false,
        apiSiteKey: null,
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const base = API_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/config/turnstile`, {
          headers: { Accept: 'application/json' },
          credentials: 'omit',
        });
        if (!res.ok) {
          throw new Error(`turnstile config ${res.status}`);
        }
        const json: {
          data?: {
            site_key?: string | null;
            show_credits_turnstile?: boolean;
          };
        } = await res.json();
        const sk =
          typeof json?.data?.site_key === 'string' &&
          json.data.site_key.trim() !== ''
            ? json.data.site_key.trim()
            : null;
        const showCredits = Boolean(json?.data?.show_credits_turnstile);
        if (!cancelled) {
          setCreditCaptchaConfig({
            loaded: true,
            showCreditsTurnstile: showCredits,
            apiSiteKey: sk,
          });
        }
      } catch {
        if (!cancelled) {
          setCreditCaptchaConfig({
            loaded: true,
            showCreditsTurnstile: false,
            apiSiteKey: null,
          });
        }
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    syncKhSafeAreaInsets();
    const id = requestAnimationFrame(() => {
      syncKhSafeAreaInsets();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

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

  const creditCaptchaConfigured =
    creditCaptchaConfig.loaded &&
    creditCaptchaConfig.showCreditsTurnstile &&
    typeof turnstileWidgetSiteKey === 'string' &&
    turnstileWidgetSiteKey !== '';

  const gateReady =
    Boolean(open) &&
    creditCaptchaConfig.loaded &&
    (!creditCaptchaConfig.showCreditsTurnstile ||
      (Boolean(turnstileWidgetSiteKey) && isResolved));

  // Step 1 : user picks a pack → PaymentFlow (captcha after payment method when enforced).
  const handlePurchase = (pkg: PointPackage) => {
    setPkgError('');
    if (!gateReady) {
      setPkgError('Chargement de la sécurité en cours, veuillez patienter.');
      return;
    }
    if (
      creditCaptchaConfig.showCreditsTurnstile &&
      creditCaptchaConfig.loaded &&
      !creditCaptchaConfigured
    ) {
      setPkgError(
        'La vérification de sécurité est temporairement indisponible. Réessayez plus tard.'
      );
      return;
    }
    setPendingPkg(pkg);
    setPhase('payment');
  };

  const handlePaymentModalClose = (): void => {
    setPendingPkg(null);
    setPhase('packs');
  };

  // Step 3a : payment verified on the server — refresh balance immediately.
  // Closing the dialog is deferred to explicit "Continuer" on the success
  // step (Stripe in-modal). No timer: avoids perceived "flash" close and
  // races with manual dismiss. Hosted checkout leaves the page; return flow uses
  // the callback route, not this handler.
  const handlePaymentSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
  }, [queryClient]);

  const handleProceedAfterCreditsPayment = useCallback(() => {
    setPendingPkg(null);
    setPhase('packs');
    onClose();
  }, [onClose]);

  const handleClose = () => {
    setPkgError('');
    setPendingPkg(null);
    setPhase('packs');
    onClose();
  };

  // MUI fires `onClose(event, reason)` for every dismissal vector
  // (`'backdropClick'`, `'escapeKeyDown'`, or programmatic). For a payment
  // dialog we MUST only honour the explicit "Fermer" button click — a stray
  // tap on the backdrop while Stripe is processing would tear down the
  // PaymentIntent UI mid-confirmation, leaving the user with a debited card
  // and no feedback. The IconButton calls `handleClose()` directly with no
  // reason, so we only ignore the two automatic vectors here.
  const handleDialogClose = useCallback(
    (_event: object, reason: 'backdropClick' | 'escapeKeyDown' | undefined) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        return;
      }
      handleClose();
    },
    // `handleClose` is stable enough (only depends on the parent `onClose`
    // prop); inline ref-style is fine here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose]
  );

  const checkoutPastPackSelection = pendingPkg !== null;
  const headerAccentGlow = ownerShell
    ? 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(246,71,95,0.22) 0%, transparent 70%)';

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown
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
          maxHeight: isMobile ? '100dvh' : '95vh',
          ...(isMobile && { height: '100dvh' }),
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
          pt: checkoutPastPackSelection
            ? {
                xs: `calc(${khSafeAreaTopSx} + 1rem)`,
                sm: `calc(${khSafeAreaTopSx} + 1rem)`,
              }
            : {
                xs: `calc(${khSafeAreaTopSx} + 1.5rem)`,
                sm: `calc(${khSafeAreaTopSx} + 2.25rem)`,
              },
          pb: checkoutPastPackSelection
            ? { xs: 1.75, sm: 2 }
            : { xs: 2.5, sm: 4 },
          background:
            'linear-gradient(135deg, #0A1628 0%, #132138 55%, #0D1F3C 100%)',
          textAlign: checkoutPastPackSelection ? 'left' : 'center',
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
            background: headerAccentGlow,
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
            top: {
              xs: `calc(${khSafeAreaTopSx} + 0.5rem)`,
              sm: `calc(${khSafeAreaTopSx} + 0.75rem)`,
            },
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

        {checkoutPastPackSelection && (
          <IconButton
            aria-label="Retour aux packs"
            onClick={handlePaymentModalClose}
            size="small"
            sx={{
              position: 'absolute',
              top: {
                xs: `calc(${khSafeAreaTopSx} + 0.5rem)`,
                sm: `calc(${khSafeAreaTopSx} + 0.75rem)`,
              },
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

        {pendingPkg && phase === 'payment' && (
          <Box sx={{ position: 'relative', zIndex: 1, pr: { xs: 4, sm: 0 } }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: 1.5,
                fontSize: '0.62rem',
                fontWeight: 700,
                lineHeight: 1,
                mb: 1,
                px: { xs: 5, sm: 5 },
              }}
            >
              Étape 2 sur 2 · Paiement
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1.25, sm: 1.5 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: ownerShell
                      ? 'rgba(13,148,136,0.2)'
                      : 'rgba(246,71,95,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CreditCard
                    sx={{ color: shellPrimary, fontSize: 20 }}
                    aria-hidden
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    noWrap
                    sx={{
                      color: '#fff',
                      letterSpacing: -0.2,
                      lineHeight: 1.15,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                    }}
                  >
                    {pendingPkg.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      display: 'block',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.72rem',
                      lineHeight: 1.2,
                      mt: 0.25,
                    }}
                  >
                    {pendingPkg.points_awarded.toLocaleString('fr-FR')}{' '}
                    {pendingPkg.points_awarded > 1 ? 'crédits' : 'crédit'}{' '}
                    seront ajoutés à votre compte après le paiement
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  textAlign: { xs: 'left', sm: 'right' },
                  flexShrink: 0,
                  maxWidth: { xs: '100%', sm: '52%' },
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    letterSpacing: -1.2,
                    fontSize: { xs: '1.75rem', sm: '2.1rem' },
                    lineHeight: 1.1,
                    fontFamily: 'inherit',
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
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {phase === 'packs' && (
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
        {pendingPkg && phase === 'payment' ? (
          <PaymentFlow
            amount={pendingPkg.price}
            type={PaymentType.CREDIT}
            planId={pendingPkg.id}
            creditTurnstileVerificationRequired={
              creditCaptchaConfig.showCreditsTurnstile &&
              creditCaptchaConfig.loaded
            }
            creditTurnstileSiteKey={turnstileWidgetSiteKey}
            onSuccess={handlePaymentSuccess}
            onProceedAfterSuccess={handleProceedAfterCreditsPayment}
            onBack={handlePaymentModalClose}
          />
        ) : null}

        {phase === 'packs' ? (
          <>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
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
              {packagesLoading || !creditCaptchaConfig.loaded ? (
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
        ) : null}
      </Box>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          pt: 2,
          pb: {
            xs: `calc(1rem + ${khSafeAreaBottomSx})`,
            sm: 2,
          },
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
