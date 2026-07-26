'use client';

import { Price } from '@/components/ui/typography/Price';
import { Typography } from '@mui/material';

interface PaymentAmountDisplayProps {
  /** Amount in XAF (canonical gateway currency). */
  amount: number;
  /** Reserved for legacy callers — only XAF is supported in production. */
  currency?: string;
  variant?: 'body1' | 'body2' | 'h6' | 'h5' | 'caption';
  fontWeight?: number;
}

/**
 * Renders the visitor's LOCAL currency (CHF / EUR / USD…) as the primary
 * value with the FCFA canonical amount as a small subtitle below. Matches
 * what Stripe will actually charge (peg conversion XAF→EUR, Stripe then
 * converts EUR→CHF for Swiss cardholders) and what we display in the
 * payment modal hero. For visitors already in XAF/XOF the component
 * collapses to a single FCFA line — no redundant subtitle.
 *
 * Historical note: previously kept FCFA primary because the gateway bills
 * XAF only. Switched to local-primary for consistency with the in-flow
 * checkout hero and to better reflect what the cardholder is debited for
 * (Stripe charges in EUR/USD, displayed locally).
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
      <Price amountXAF={amount} primary="local" showOriginal />
    </Typography>
  );
}
