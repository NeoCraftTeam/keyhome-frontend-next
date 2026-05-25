import { buildStripeConfirmReturnUrl } from '@/lib/payment/stripe-confirm-return';
import { PaymentType } from '@/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('buildStripeConfirmReturnUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('appends tx_ref for credit using window.origin', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://pay.example.com' },
    } as Window & typeof globalThis);
    expect(
      buildStripeConfirmReturnUrl({
        paymentType: PaymentType.CREDIT,
        txRef: 'tx-123',
        adId: null,
      })
    ).toBe('https://pay.example.com/payment/return?flow=credit&tx_ref=tx-123');
  });

  it('encodes unlock URL with ad_id and tx_ref', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://pay.example.com' },
    } as Window & typeof globalThis);
    expect(
      buildStripeConfirmReturnUrl({
        paymentType: PaymentType.UNLOCK,
        txRef: 'tx/99',
        adId: 'ad-uuid',
      })
    ).toBe(
      'https://pay.example.com/payment/return?flow=unlock&ad_id=ad-uuid&tx_ref=tx%2F99'
    );
  });

  it('builds subscription path with tx_ref', () => {
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3000' },
    } as Window & typeof globalThis);
    expect(
      buildStripeConfirmReturnUrl({
        paymentType: PaymentType.SUBSCRIPTION,
        txRef: 'sub-1',
        adId: null,
      })
    ).toBe(
      'http://localhost:3000/payment/return?flow=subscription&tx_ref=sub-1'
    );
  });
});
