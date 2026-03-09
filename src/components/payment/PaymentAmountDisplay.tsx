'use client';

import { Typography } from '@mui/material';

interface PaymentAmountDisplayProps {
  amount: number;
  currency?: string;
  variant?: 'body1' | 'body2' | 'h6' | 'h5' | 'caption';
  fontWeight?: number;
}

export default function PaymentAmountDisplay({
  amount,
  currency = 'XAF',
  variant = 'body1',
  fontWeight = 600,
}: PaymentAmountDisplayProps): React.ReactElement {
  const formatted = new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <Typography variant={variant} fontWeight={fontWeight} component="span">
      {formatted}
    </Typography>
  );
}
