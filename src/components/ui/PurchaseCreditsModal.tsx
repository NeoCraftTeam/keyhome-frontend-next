'use client';

import PackageCard from '@/components/ui/PackageCard';
import { creditsService } from '@/services/credits.service';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import type { PointPackage } from '@/types';
import { AutoAwesome, Close, Toll } from '@mui/icons-material';
import {
  Box,
  Dialog,
  Grid,
  IconButton,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface PurchaseCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PurchaseCreditsModal({ open, onClose }: PurchaseCreditsModalProps) {
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [pkgError, setPkgError] = useState('');
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['credits-packages'],
    queryFn: () => creditsService.getPackages(),
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const availableCredits = balance ?? 0;
  const creditsLabel = availableCredits > 1 ? 'credits disponibles' : 'credit disponible';

  const handlePurchase = async (pkg: PointPackage) => {
    setLoadingPkg(pkg.id);
    setPkgError('');
    try {
      const callbackUrl = `${window.location.origin}/credits/callback`;
      const response = await creditsService.purchase(pkg.id, callbackUrl);
      if (!redirectToTrustedUrl(response.payment_url)) {
        throw new Error('URL de paiement non approuvee.');
      }
      queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
    } catch {
      setPkgError("Erreur lors de l\'initialisation du paiement.");
    } finally {
      setLoadingPkg(null);
    }
  };

  const handleClose = () => {
    setPkgError('');
    setLoadingPkg(null);
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
          overflow: 'hidden',
          maxHeight: isMobile ? '100vh' : '92vh',
          background: 'transparent',
          boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.28)',
        },
      }}
    >
      {/* ── HEADER ────────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 4,
          pb: 3.5,
          background: 'linear-gradient(135deg, #0A1628 0%, #1a2540 50%, #0D1F3C 100%)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background blobs */}
        <Box sx={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(246,71,95,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <IconButton
          aria-label="Fermer"
          onClick={handleClose}
          sx={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Balance ring */}
        <Box
          sx={{
            position: 'relative',
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F6475F, #D93A50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(246,71,95,0.15), 0 0 0 16px rgba(246,71,95,0.07)',
            }}
          >
            <Toll sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
        </Box>

        <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', letterSpacing: -1.5, lineHeight: 1, mb: 0.5 }}>
          {balanceLoading ? (
            <Skeleton width={80} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
          ) : (
            availableCredits.toLocaleString('fr-FR')
          )}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
          {balanceLoading ? 'credits disponibles' : creditsLabel}
        </Typography>


        {/* Trust badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 2,
          bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '40px', px: 2, py: 0.75,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <AutoAwesome sx={{ fontSize: 12, color: '#FFD700' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 600 }}>
            +5 000 utilisateurs en Afrique
          </Typography>
        </Box>
      </Box>

      {/* ── PACKAGES ─────────────────────────────────────── */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2.5,
          bgcolor: isDark ? '#0F172A' : 'background.paper',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        }}
      >
        <Typography variant="overline" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary', letterSpacing: 1.5, fontSize: '0.65rem', fontWeight: 700 }}>
          Choisir un pack
        </Typography>

        {pkgError && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, mb: 0.5 }}>
            {pkgError}
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mt: 1.5 }}>
          {packagesLoading ? (
            [1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                />
              </Grid>
            ))
          ) : packages && packages.length > 0 ? (
            packages.map((pkg) => (
              <Grid key={pkg.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <PackageCard
                  pkg={pkg}
                  loading={loadingPkg === pkg.id}
                  onPurchase={handlePurchase}
                />
              </Grid>
            ))
          ) : (
            <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'text.secondary', textAlign: 'center', py: 4, width: '100%' }}>
              Aucun pack disponible.
            </Typography>
          )}
        </Grid>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 2, bgcolor: isDark ? '#0A0F1E' : 'background.default', borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider' }}>
        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'text.disabled', lineHeight: 1.5, display: 'block', textAlign: 'center', fontSize: '0.7rem' }}>
          Les credits permettent de deverrouiller les coordonnees des annonceurs.
          Paiement securise.
        </Typography>
      </Box>
    </Dialog>
  );
}
