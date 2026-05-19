import { readCheckoutSessionTotalAmount } from '@/lib/stripe-checkout-total';
import { describe, expect, it } from 'vitest';

describe('readCheckoutSessionTotalAmount', () => {
  it('returns the formatted Stripe total when present', () => {
    expect(
      readCheckoutSessionTotalAmount({
        total: { total: { amount: '12,50 €' } },
      })
    ).toBe('12,50 €');
  });

  it('returns null when total is missing or blank', () => {
    expect(readCheckoutSessionTotalAmount({})).toBeNull();
    expect(
      readCheckoutSessionTotalAmount({
        total: { total: { amount: '   ' } },
      })
    ).toBeNull();
  });
});
