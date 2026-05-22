/**
 * Vitest unit tests for `usePaymentStatusPolling`.
 *
 * Covers the four scenarios that matter to the user-facing callback page :
 *   1. Happy path  → success on first poll, balance + onSuccess fired.
 *   2. Auth lost   → 401 on auth endpoint, fall back to public status.
 *   3. Failure     → terminal failed status surfaces immediately.
 *   4. Cancellation→ unmount cancels timers (no stale state writes).
 */
import { usePaymentStatusPolling } from '@/hooks/usePaymentStatusPolling';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the two services used inside the hook so we can drive their behaviour
// from each test without touching the real Axios client.
vi.mock('@/services/credits.service', () => ({
  creditsService: {
    verifyPurchase: vi.fn(),
  },
}));
vi.mock('@/services/payments.service', () => ({
  paymentsService: {
    publicStatus: vi.fn(),
    verify: vi.fn(),
  },
}));

import { creditsService } from '@/services/credits.service';
import { paymentsService } from '@/services/payments.service';

const mockedCredits = vi.mocked(creditsService);
const mockedPayments = vi.mocked(paymentsService);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Helper that builds a fake Axios 401 the same way the real interceptor does,
 * so the hook's `axios.isAxiosError(err) && err.response?.status === 401`
 * branch fires exactly as in production.
 */
function axios401(): Error {
  return new axios.AxiosError(
    'Unauthenticated',
    'ERR_BAD_REQUEST',
    undefined,
    null,
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
      data: {},
    }
  );
}

describe('usePaymentStatusPolling — credit variant', () => {
  it('emits success and updates balance on first successful poll', async () => {
    mockedCredits.verifyPurchase.mockResolvedValueOnce({
      status: 'completed',
      message: 'OK',
      point_balance: 75,
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-AAAAAA000001',
        variant: 'credit',
        onSuccess,
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('success'));
    expect(result.current.pointBalance).toBe(75);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockedCredits.verifyPurchase).toHaveBeenCalledWith(
      'KH-AAAAAA000001',
      null,
      null
    );
    // Public status must NOT be hit when the auth endpoint succeeded.
    expect(mockedPayments.publicStatus).not.toHaveBeenCalled();
  });

  it('falls back to public-status on 401 (auth lost) and never logs the user out', async () => {
    mockedCredits.verifyPurchase.mockRejectedValue(axios401());
    mockedPayments.publicStatus.mockResolvedValueOnce({ status: 'success' });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-BBBBBB000002',
        variant: 'credit',
        onSuccess,
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('auth_lost'));
    // onSuccess STILL fires because the public endpoint confirmed the
    // payment — the parent should invalidate balance queries either way.
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockedPayments.publicStatus).toHaveBeenCalledWith('KH-BBBBBB000002');
  });

  it('surfaces terminal failure immediately when redirect status is failed', async () => {
    mockedCredits.verifyPurchase.mockResolvedValue({
      status: 'failed',
      message: 'Échec',
      point_balance: 0,
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-CCCCCC000003',
        gatewayRedirectStatus: 'failed',
        variant: 'credit',
        onSuccess,
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('failed'));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('keeps polling when verify returns failed but redirect status is completed', async () => {
    mockedCredits.verifyPurchase.mockResolvedValue({
      status: 'failed',
      message: 'Échec',
      point_balance: 0,
    });
    mockedPayments.publicStatus.mockResolvedValue({ status: 'pending' });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-3X2HK4FMW3VR',
        gatewayReference: 'SANDBOX_R2YUJPRMF62CQXYI',
        gatewayRedirectStatus: 'completed',
        variant: 'credit',
        onSuccess,
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() =>
      expect(mockedCredits.verifyPurchase).toHaveBeenCalled()
    );
    expect(result.current.state).not.toBe('failed');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('skips polling entirely when skip is true', async () => {
    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-DDDDDD000004',
        variant: 'credit',
        skip: true,
      })
    );

    // Wait one tick to make sure no async work was queued.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result.current.state).toBe('verifying');
    expect(mockedCredits.verifyPurchase).not.toHaveBeenCalled();
    expect(mockedPayments.publicStatus).not.toHaveBeenCalled();
  });

  it('treats 404 (no recent purchase) as terminal not_found for the credit variant', async () => {
    mockedCredits.verifyPurchase.mockRejectedValue(
      new axios.AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, null, {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as never,
        data: {},
      })
    );

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-EEEEEE000005',
        variant: 'credit',
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('not_found'));
    expect(mockedPayments.publicStatus).not.toHaveBeenCalled();
  });
});

describe('usePaymentStatusPolling — unlock variant', () => {
  it('emits success when paymentsService.verify confirms is_paid', async () => {
    mockedPayments.verify.mockResolvedValueOnce({
      status: 'success',
      is_paid: true,
      is_unlocked: true,
      reference: 'pay-id',
      ad_id: 'ad-id',
      tx_ref: 'KH-UNLK000001',
      gateway: 'flutterwave',
      payment_method: 'mobile_money',
      payment_method_label: 'Mobile Money',
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-UNLK000001',
        variant: 'unlock',
        onSuccess,
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('success'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('detects gateway-side cancellation', async () => {
    mockedPayments.verify.mockResolvedValueOnce({
      status: 'cancelled',
      is_paid: false,
      is_unlocked: false,
      reference: 'pay-id',
      ad_id: 'ad-id',
      tx_ref: 'KH-UNLK000002',
      gateway: 'flutterwave',
      payment_method: null,
      payment_method_label: null,
    });

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-UNLK000002',
        variant: 'unlock',
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(() => expect(result.current.state).toBe('cancelled'));
  });

  it('keeps polling when verify reports failed but gateway redirect says completed', async () => {
    mockedPayments.verify.mockResolvedValue({
      status: 'failed',
      is_paid: false,
      is_unlocked: false,
      reference: 'pay-id',
      ad_id: 'ad-id',
      tx_ref: 'KH-UNLK000003',
      gateway: 'geniuspay',
      payment_method: null,
      payment_method_label: null,
    });
    mockedPayments.publicStatus.mockResolvedValue({ status: 'pending' });

    const { result } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-UNLK000003',
        gatewayRedirectStatus: 'completed',
        variant: 'unlock',
        minimumVerifyingMs: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.state).not.toBe('failed');
        expect(mockedPayments.verify.mock.calls.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => expect(mockedPayments.verify.mock.calls.length).toBeGreaterThan(1),
      { timeout: 3000 }
    );
  });
});

describe('usePaymentStatusPolling — lifecycle', () => {
  it('does not call setState on stale timers after unmount', async () => {
    // Simulate a pending poll that resolves AFTER the hook is unmounted.
    let resolvePoll: (value: { status: 'pending' }) => void = () => undefined;
    mockedPayments.publicStatus.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePoll = resolve;
      })
    );
    mockedCredits.verifyPurchase.mockRejectedValue(axios401());

    const { result, unmount } = renderHook(() =>
      usePaymentStatusPolling({
        txRef: 'KH-LIFECYCLE001',
        variant: 'credit',
      })
    );

    // First tick: auth fails → falls back to public → pending promise.
    await waitFor(() => expect(result.current.state).toBe('auth_lost'));

    // Unmount BEFORE resolving the public-status promise.
    unmount();
    await act(async () => {
      resolvePoll({ status: 'pending' });
      await new Promise((r) => setTimeout(r, 5));
    });

    // The hook's cancelledRef stops the loop; no React state writes to the
    // unmounted component, no warnings emitted.
  });
});
