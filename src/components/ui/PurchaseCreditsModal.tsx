'use client';

import PackageCard from '@/components/ui/PackageCard';
import { creditsService } from '@/services/credits.service';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import type { PointPackage } from '@/types';
import { Close, Toll } from '@mui/icons-material';
import {
  Box,
  Dialog,
  IconButton,
  Skeleton,
  Typography,
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

  const handlePurchase = async (pkg: PointPackage) => {
    setLoadingPkg(pkg.id);
    setPkgError('');
    try {
      const callbackUrl = `${window.location.origin}/credits/callback`;
      const response = await creditsService.purchase(pkg.id, callbackUrl);
      if (!redirectToTrustedUrl(response.payment_url)) {
        throw new Error('URL de paiement non approuvée.');
      }
      queryClient.invalidateQueries({ queryKey: ['credits-balance'] });
    } catch {
      setPkgError('Erreur lors de l\'initialisation du paiement.');
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
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header gradient */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 3.5,
          pb: 3,
          background: 'linear-gradient(135deg, #F6475F 0%, #D93A50 60%, #A01030 100%)',
          textAlign: 'center',
        }}
      >
        <IconButton
          aria-label="Fermer"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Balance circle */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <Toll sx={{ color: '#fff', fontSize: 28 }} />
        </Box>

        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}
        >
          {balanceLoading ? '...' : (balance ?? 0).toLocaleString('fr-FR')}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}
        >
          crédits disponibles
        </Typography>
      </Box>

      {/* Packages list */}
      <Box sx={{ px: 3, pt: 2.5, pb: 2, overflowY: 'auto' }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.7rem', mb: 0.5 }}
        >
          Choisir un pack
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Rejoint par plus de 5 000 utilisateurs en Afrique
        </Typography>

        {pkgError && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
            {pkgError}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
          {packagesLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3, flex: 1, minWidth: 0 }} />
            ))
          ) : packages && packages.length > 0 ? (
            packages.map((pkg) => (
              <Box key={pkg.id} sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                <PackageCard
                  pkg={pkg}
                  loading={loadingPkg === pkg.id}
                  onPurchase={handlePurchase}
                />
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Aucun pack disponible pour le moment.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ lineHeight: 1.5, display: 'block', textAlign: 'center' }}
        >
          Les crédits permettent de déverrouiller les coordonnées des annonceurs.
        </Typography>
      </Box>
    </Dialog>
  );
}
