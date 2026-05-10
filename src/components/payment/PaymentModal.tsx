'use client';

import PaymentFlow from '@/components/payment/PaymentFlow';
import { Price } from '@/components/ui/Price';
import { brand } from '@/theme/tokens';
import { PaymentType } from '@/types';
import Close from '@mui/icons-material/Close';
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
  /** Called when the payment was confirmed successful. */
  onSuccess?: () => void;
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
  onSuccess,
}: PaymentModalProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          overflow: 'hidden',
          background: 'transparent',
          boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.28)',
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 4,
          pb: 3,
          background:
            'linear-gradient(135deg, #0A1628 0%, #1a2540 50%, #0D1F3C 100%)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(246,71,95,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            right: -30,
            width: 150,
            height: 150,
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
            top: 12,
            right: 12,
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'rgba(246,71,95,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <Lock sx={{ color: brand.primary, fontSize: 26 }} />
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: '#fff', letterSpacing: -0.5, lineHeight: 1.2, mb: 0.5 }}
        >
          {label ?? 'Paiement sécurisé'}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={900}
          component="div"
          sx={{ color: brand.primary, letterSpacing: -1 }}
        >
          <Price amountXAF={amount} primary="xaf" />
        </Typography>
      </Box>

      {/* ── BODY ── */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, bgcolor: 'background.paper' }}>
        <PaymentFlow
          amount={amount}
          type={type}
          adId={adId}
          agencyId={agencyId}
          planId={planId}
          period={period}
          onSuccess={onSuccess}
        />
      </Box>

      {/* ── FOOTER ── */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
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
