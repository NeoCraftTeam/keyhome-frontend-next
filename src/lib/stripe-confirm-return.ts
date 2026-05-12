import { getSiteOrigin } from '@/lib/site-url';
import { PaymentType } from '@/types';

/**
 * Absolute URL Stripe redirects to after wallet / PayPal / similar flows.
 * Custom query params (e.g. `tx_ref`) are preserved per Stripe docs.
 */
export function buildStripeConfirmReturnUrl(options: {
  paymentType: PaymentType;
  txRef: string | null;
  adId: string | null;
}): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : getSiteOrigin();
  const tx = options.txRef?.trim() ?? '';

  const paymentReturn = (flow: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ flow, ...extra });
    return `${base}/payment/return?${params.toString()}`;
  };

  switch (options.paymentType) {
    case PaymentType.CREDIT:
      if (tx !== '') {
        return paymentReturn('credit', { tx_ref: tx });
      }
      return paymentReturn('credit');
    case PaymentType.UNLOCK: {
      const ad = options.adId?.trim() ?? '';
      if (ad !== '' && tx !== '') {
        return paymentReturn('unlock', { ad_id: ad, tx_ref: tx });
      }
      if (tx !== '') {
        return paymentReturn('unlock', { tx_ref: tx });
      }
      return paymentReturn('unlock');
    }
    case PaymentType.SUBSCRIPTION:
      if (tx !== '') {
        return paymentReturn('subscription', { tx_ref: tx });
      }
      return paymentReturn('subscription');
    case PaymentType.BOOST:
      if (tx !== '') {
        return paymentReturn('boost', { tx_ref: tx });
      }
      return paymentReturn('boost');
    default:
      return `${base}/home`;
  }
}
