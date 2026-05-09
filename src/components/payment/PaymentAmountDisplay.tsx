'use client';

import { Price } from '@/components/ui/Price';
import { Typography } from '@mui/material';

interface PaymentAmountDisplayProps {
  /** Amount in XAF (canonical Flutterwave currency). */
  amount: number;
  /** Reserved for legacy callers — only XAF is supported in production. */
  currency?: string;
  variant?: 'body1' | 'body2' | 'h6' | 'h5' | 'caption';
  fontWeight?: number;
}

/**
 * Always renders the FCFA amount as the primary value (Flutterwave bills XAF
 * exclusively — receipts, history, modals must keep that as the canonical
 * legal record). Visitors in EUR/USD/etc. get a small `≈ X €` subtitle for
 * comprehension, never the other way round.
 */
export default function PaymentAmountDisplay({
  amount,
  currency = 'XAF',
  variant = 'body1',
  fontWeight = 600,
}: PaymentAmountDisplayProps): React.ReactElement {
  // Non-XAF legacy callers: render Intl-style without conversion.
  if (currency !== 'XAF' && currency !== 'XOF') {
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

  return (
    <Typography variant={variant} fontWeight={fontWeight} component="span">
      <Price amountXAF={amount} primary="xaf" />
    </Typography>
  );
}
