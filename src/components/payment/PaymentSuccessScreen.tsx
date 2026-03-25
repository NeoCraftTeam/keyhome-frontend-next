'use client';

import PaymentAmountDisplay from '@/components/payment/PaymentAmountDisplay';
import { CheckCircle } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';

interface PaymentSuccessScreenProps {
  amount: number;
  txRef?: string | null;
  countdown?: number;
  onGoHome?: () => void;
}

export default function PaymentSuccessScreen({
  amount,
  txRef,
  countdown,
  onGoHome,
}: PaymentSuccessScreenProps): React.ReactElement {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 4,
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Image src="/images/logo.png" alt="KeyHome" width={48} height={48} />

      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(0,138,5,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          '@keyframes scaleIn': {
            '0%': { transform: 'scale(0)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      >
        <CheckCircle sx={{ color: '#008A05', fontSize: 42 }} />
      </Box>

      <Typography variant="h6" fontWeight={800}>
        Paiement confirmé !
      </Typography>

      <PaymentAmountDisplay amount={amount} variant="h5" fontWeight={900} />

      {txRef && (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          Réf : {txRef}
        </Typography>
      )}

      {typeof countdown === 'number' && countdown > 0 && (
        <Typography variant="body2" color="text.secondary">
          Redirection dans <strong>{countdown}s</strong>…
        </Typography>
      )}

      {onGoHome && (
        <Button
          variant="contained"
          onClick={onGoHome}
          sx={{ borderRadius: 3, px: 4, py: 1.2, fontWeight: 700, bgcolor: '#008A05', '&:hover': { bgcolor: '#007004' } }}
        >
          Retour à l&apos;accueil
        </Button>
      )}
    </Box>
  );
}
