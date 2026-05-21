import { describe, expect, it } from 'vitest';
import {
  buildPaymentReturnRedirectUrl,
  hasPaymentReturnReference,
  inferPaymentReturnFlow,
  isGatewayRedirectFailed,
  isGatewayRedirectSuccess,
  parsePaymentReturnParams,
  resolvePaymentVerifyUiState,
  shouldDeferVerifyFailure,
} from '@/lib/payment-gateway-return';

describe('payment-gateway-return', () => {
  it('parses geniuspay redirect query params', () => {
    const params = new URLSearchParams(
      'reference=SANDBOX_V1A7ZXW9QSR8HHP6&status=completed'
    );
    expect(parsePaymentReturnParams(params)).toEqual({
      txRef: null,
      gatewayReference: 'SANDBOX_V1A7ZXW9QSR8HHP6',
      status: 'completed',
    });
    expect(hasPaymentReturnReference(parsePaymentReturnParams(params))).toBe(
      true
    );
  });

  it('maps completed status as gateway success', () => {
    expect(isGatewayRedirectSuccess('completed')).toBe(true);
    expect(isGatewayRedirectSuccess('successful')).toBe(true);
    expect(isGatewayRedirectSuccess('paid')).toBe(true);
    expect(isGatewayRedirectFailed('completed')).toBe(false);
  });

  it('defers verify failure when redirect status is completed', () => {
    expect(
      shouldDeferVerifyFailure(
        { status: 'failed', is_paid: false },
        'completed'
      )
    ).toBe(true);
    expect(
      shouldDeferVerifyFailure(
        { status: 'pending', is_paid: false },
        'completed'
      )
    ).toBe(true);
    expect(
      shouldDeferVerifyFailure({ status: 'failed', is_paid: false }, 'failed')
    ).toBe(false);
  });

  it('resolves optimistic success after retries when URL is completed', () => {
    expect(
      resolvePaymentVerifyUiState(
        { status: 'failed', is_paid: false },
        'completed',
        { retriesExhausted: false }
      )
    ).toBe('retry');
    expect(
      resolvePaymentVerifyUiState(
        { status: 'failed', is_paid: false },
        'completed',
        { retriesExhausted: true }
      )
    ).toBe('success');
    expect(
      resolvePaymentVerifyUiState(
        { status: 'success', is_paid: true },
        'completed',
        { retriesExhausted: true }
      )
    ).toBe('success');
  });

  it('prefers tx_ref when both references are present', () => {
    const params = new URLSearchParams(
      'tx_ref=KH-ABCDEF123456&reference=SANDBOX_ABC&status=completed'
    );
    expect(parsePaymentReturnParams(params).txRef).toBe('KH-ABCDEF123456');
    expect(parsePaymentReturnParams(params).gatewayReference).toBe(
      'SANDBOX_ABC'
    );
  });

  it('builds canonical return URL for legacy callback with flow default', () => {
    const params = new URLSearchParams(
      'tx_ref=KH-3X2HK4FMW3VR&reference=SANDBOX_R2YUJPRMF62CQXYI&status=completed'
    );

    expect(buildPaymentReturnRedirectUrl(params)).toBe(
      '/payment/return?tx_ref=KH-3X2HK4FMW3VR&reference=SANDBOX_R2YUJPRMF62CQXYI&status=completed&flow=credit'
    );
    expect(inferPaymentReturnFlow(params)).toBe('credit');
  });

  it('infers unlock flow when ad_id is present', () => {
    const params = new URLSearchParams(
      'tx_ref=KH-UNLOCK&status=completed&ad_id=abc-123'
    );

    expect(inferPaymentReturnFlow(params)).toBe('unlock');
    expect(buildPaymentReturnRedirectUrl(params)).toContain('flow=unlock');
  });
});
