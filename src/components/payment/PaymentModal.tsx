'use client';

import PaymentFlow from '@/components/payment/PaymentFlow';
import { Price } from '@/components/ui/Price';
import {
  khSafeAreaBottomSx,
  khSafeAreaTopSx,
  syncKhSafeAreaInsets,
} from '@/lib/safe-area-insets';
import { brand } from '@/theme/tokens';
import { PaymentType } from '@/types';
import Close from '@mui/icons-material/Close';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Lock from '@mui/icons-material/Lock';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Image from 'next/image';
import { useEffect } from 'react';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Amount in XAF (canonical) — only used by the header. */
  amount: number;
  type: PaymentType;
  adId?: string | null;
  agencyId?: string | null;
  planId?: string | null;
  period?: 'monthly' | 'yearly' | null;
  /** Optional label shown in the header (e.g. property title or pack name). */
  label?: string;
  /**
   * Optional small subtitle shown UNDER the label in the compact header
   * (e.g. "10 crédits" for a credit pack). When provided the header switches
   * to its horizontal compact variant so the Stripe card form remains
   * above the fold on mobile.
   */
  subLabel?: string;
  /**
   * Stepper hint shown as a discreet uppercase label at the very top of the
   * header (e.g. "Étape 2 sur 2 · Paiement"). Optional — omit when the
   * parent already exposes a dedicated stepper.
   */
  stepHint?: string;
  /** Called when the payment was confirmed successful. */
  onSuccess?: () => void;
  /**
   * When set, the in-modal success step shows "Continuer" and invokes this.
   * Omit to leave success without a primary CTA (user can still use dialog close).
   */
  onProceedAfterSuccess?: () => void;
}

/**
 * Standalone payment modal — wraps `<PaymentFlow>` in a `<Dialog>` with the
 * branded crimson/pink header. Use this when the payment is a one-off action
 * popped over the current page (e.g. unlock-ad).
 *
 * For embedded flows (e.g. inside the credits-purchase stepper), use
 * `<PaymentFlow>` directly to avoid stacking dialogs.
 */
export default function PaymentModal({
  open,
  onClose,
  amount,
  type,
  adId = null,
  agencyId = null,
  planId = null,
  period = null,
  label,
  subLabel,
  stepHint,
  onSuccess,
  onProceedAfterSuccess,
}: PaymentModalProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 5,
          overflow: isMobile ? 'auto' : 'hidden',
          background: 'transparent',
          boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.28)',
          // dvh accounts for collapsible browser chrome and PWA safe areas
          ...(isMobile && { maxHeight: '100dvh', height: '100dvh' }),
        },
      }}
    >
      {/* ── HEADER (compact, ~80–100 px on desktop, vertical fallback < sm) ── */}
      <Box
        sx={{
          position: 'relative',
          // Compact paddings — was `pt: 4, pb: 3` and cost ~30 px more on
          // small viewports. Keeping the dark gradient identity but
          // surrendering vertical real-estate to the Stripe form below.
          px: { xs: 2, sm: 2.5 },
          pt: {
            xs: `calc(${khSafeAreaTopSx} + 1rem)`,
            sm: `calc(${khSafeAreaTopSx} + 1rem)`,
          },
          pb: { xs: 1.75, sm: 1.75 },
          background:
            'linear-gradient(135deg, #0A1628 0%, #1a2540 50%, #0D1F3C 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Decorative radial glows — kept but smaller / further off-canvas
            so they don't bleed into the compact body. */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            left: -50,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(246,71,95,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <IconButton
          aria-label="Fermer"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: `calc(${khSafeAreaTopSx} + 0.375rem)`,
            right: 6,
            color: 'rgba(255,255,255,0.55)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            zIndex: 2,
          }}
          size="small"
        >
          <Close fontSize="small" />
        </IconButton>

        {stepHint && (
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
              px: 3.5,
            }}
          >
            {stepHint}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            // Horizontal on tablet+ to compress vertical footprint.
            // Vertical fallback on very narrow phones (< 380 px) avoids
            // truncation of the pack label or the price.
            flexDirection: { xs: 'row', sm: 'row' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          {/* Left cluster: brand icon + label + sub-label */}
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
                bgcolor: 'rgba(246,71,95,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {label ? (
                <CreditCardIcon
                  sx={{ color: brand.primary, fontSize: 20 }}
                  aria-hidden
                />
              ) : (
                <Lock sx={{ color: brand.primary, fontSize: 20 }} aria-hidden />
              )}
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
                {label ?? 'Paiement sécurisé'}
              </Typography>
              {subLabel && (
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
                  {subLabel}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right cluster: visitor-currency price (primary) +
              FCFA reference subtitle (auto-shown when currency ≠ XAF/XOF).
              The `<Price>` subtitle inherits `text.secondary` which renders
              as `rgba(255,255,255,0.7)` on the dark gradient → legible. */}
          <Box
            sx={{
              textAlign: 'right',
              flexShrink: 0,
              maxWidth: '52%',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={900}
              component="div"
              sx={{
                color: brand.primary,
                letterSpacing: -0.5,
                lineHeight: 1.1,
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                '& > span > span:last-child': {
                  // Tighten the XAF reference subtitle.
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.62em !important',
                  mt: '2px !important',
                },
              }}
            >
              <Price amountXAF={amount} primary="local" showOriginal />
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── BODY ── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.25 },
          pb: { xs: 2, sm: 2.5 },
          bgcolor: 'background.paper',
        }}
      >
        <PaymentFlow
          amount={amount}
          type={type}
          adId={adId}
          agencyId={agencyId}
          planId={planId}
          period={period}
          onSuccess={onSuccess}
          onProceedAfterSuccess={onProceedAfterSuccess}
        />
      </Box>

      {/* ── FOOTER ── */}
      <Box
        sx={{
          px: 3,
          pt: 1.5,
          pb: {
            xs: `calc(0.75rem + ${khSafeAreaBottomSx})`,
            sm: 1.5,
          },
          bgcolor: isDark ? '#0A0F1E' : 'background.default',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Image src="/images/logo.png" alt="KeyHome" width={16} height={16} />
          <Typography
            variant="caption"
            sx={{
              color: isDark ? 'rgba(255,255,255,0.3)' : 'text.disabled',
              fontSize: '0.7rem',
            }}
          >
            Paiement sécurisé · Mobile Money &amp; Carte bancaire
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
