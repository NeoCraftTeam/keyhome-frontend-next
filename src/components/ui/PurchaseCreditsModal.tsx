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
    refetchInterval: (query) => (query.state.status === 'error' ? false : 30_000),
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
  const creditsLabel = availableCredits > 1 ? 'crédits disponibles' : 'crédit disponible';

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
          background: (theme) => theme.palette.gradient?.primary135 ?? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background blobs */}
        <Box sx={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <IconButton
          aria-label="Fermer"
          onClick={handleClose}
          sx={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.9)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Balance widget - exact same design as navbar CreditsWidget */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              background: 'linear-gradient(135deg, rgba(246,71,95,0.12) 0%, rgba(246,71,95,0.06) 100%)',
              border: '1px solid',
              borderColor: 'rgba(246,71,95,0.25)',
              borderRadius: '40px',
              px: 1.5,
              py: 0.55,
              cursor: 'default',
              userSelect: 'none',
              transition: 'all 0.18s',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(246,71,95,0.2) 0%, rgba(246,71,95,0.12) 100%)',
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(246,71,95,0.12)',
              },
            }}
          >
            <Toll sx={{ fontSize: 15, color: 'primary.main' }} />
            {balanceLoading ? (
              <Skeleton width={28} height={14} sx={{ borderRadius: 1 }} />
            ) : (
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ color: 'primary.main', lineHeight: 1, letterSpacing: -0.3, fontSize: '0.82rem' }}
              >
                {(balance ?? 0).toLocaleString('fr-FR')}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: -0.5, lineHeight: 1.2, mb: 1 }}>
          {balanceLoading ? (
            <Skeleton width={80} height={32} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          ) : (
            availableCredits.toLocaleString('fr-FR')
          )}
        </Typography>
        <Typography variant="body1" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.9)', letterSpacing: 0.2, mb: 2 }}>
          {balanceLoading ? 'crédits disponibles' : creditsLabel}
        </Typography>


        {/* Trust badge */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 2,
          bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '40px', px: 2, py: 0.75,
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <AutoAwesome sx={{ fontSize: 12, color: 'rgba(255,255,255,0.95)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.7rem', fontWeight: 600 }}>
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
          bgcolor: 'background.paper',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        }}
      >
        <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.5, fontSize: '0.65rem', fontWeight: 700 }}>
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
                <Grid
                  key={pkg.id}
                  size={{ xs: 12, sm: 6, md: 4 }}
                >
                  <PackageCard
                    pkg={pkg}
                    loading={loadingPkg === pkg.id}
                    onPurchase={handlePurchase}
                  />
                </Grid>
              ))
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4, width: '100%' }}>
              Aucun pack disponible.
            </Typography>
          )}
        </Grid>
      </Box>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.5, display: 'block', textAlign: 'center', fontSize: '0.7rem' }}>
          Les credits permettent de deverrouiller les coordonnees des annonceurs.
          Paiement securise.
        </Typography>
      </Box>
    </Dialog>
  );
}
