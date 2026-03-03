'use client';

import PurchaseCreditsModal from '@/components/ui/PurchaseCreditsModal';
import { creditsService } from '@/services/credits.service';
import { Toll } from '@mui/icons-material';
import {
  Box,
  Skeleton,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function CreditsWidget() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => creditsService.getBalance(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  return (
    <>
      <Box
        onClick={() => setModalOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          background: 'linear-gradient(135deg, rgba(246,71,95,0.12) 0%, rgba(246,71,95,0.06) 100%)',
          border: '1px solid rgba(246,71,95,0.25)',
          borderRadius: '40px',
          px: 1.5,
          py: 0.55,
          cursor: 'pointer',
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

      <PurchaseCreditsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
