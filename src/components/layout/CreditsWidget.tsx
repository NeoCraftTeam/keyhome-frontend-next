'use client';

import PurchaseCreditsModal from '@/components/ui/PurchaseCreditsModal';
import { creditsService } from '@/services/credits.service';
import { AddCircleOutline, Toll } from '@mui/icons-material';
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
      {/* Balance pill */}
      <Box
        onClick={() => setModalOpen(true)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '40px',
          px: 1.5,
          py: 0.6,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.18s',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(246,71,95,0.1)',
          },
        }}
      >
        <Toll sx={{ fontSize: 16, color: 'primary.main' }} />
        {balanceLoading ? (
          <Skeleton width={36} height={16} sx={{ borderRadius: 1 }} />
        ) : (
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: 'text.primary', lineHeight: 1, letterSpacing: -0.3 }}
          >
            {(balance ?? 0).toLocaleString('fr-FR')}
          </Typography>
        )}
        <AddCircleOutline sx={{ fontSize: 14, color: 'text.secondary', ml: 0.25 }} />
      </Box>

      {/* Purchase modal */}
      <PurchaseCreditsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
