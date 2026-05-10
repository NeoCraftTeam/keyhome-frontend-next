import api from '@/lib/api';
import { rememberPaymentOriginPath } from '@/lib/payment-return';
import {
  FlutterwaveInitiatePayload,
  FlutterwaveInitiateResponse,
  FlutterwaveVerifyResponse,
  PaymentHistoryItem,
  PaymentMethodInfo,
  UnlockResponse,
} from '@/types';

export const paymentsService = {
  /**
   * Catalogue of payment methods currently enabled by the admin.
   *
   * Backed by `GET /api/v1/payments/methods` (PaymentMethodGateService).
   * Returns ONLY enabled methods, with their gateway routing rule, so the
   * `<PaymentModal>` can render a dynamic selector instead of hard-coding
   * the four PaymentMethod cases.
   *
   * Cached upstream by the API throttle middleware ; safe to call on every
   * modal open without flooding the backend.
   */
  async fetchAvailableMethods(): Promise<PaymentMethodInfo[]> {
    const { data } = await api.get<{ data: PaymentMethodInfo[] }>(
      '/payments/methods'
    );
    return data.data ?? [];
  },

  /**
   * Attempt to unlock an ad using credits.
   * If the user has enough points → returns { status: 'unlocked' }.
   * If not → returns { status: 'insufficient_points', packages: [...] } with HTTP 402.
   * Axios throws on 402, so we must catch and read error.response.data.
   */
  async initialize(adId: string): Promise<UnlockResponse> {
    try {
      const { data } = await api.post(`/payments/initialize/${adId}`);
      return data as UnlockResponse;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: UnlockResponse } };
      if (axiosErr?.response?.data?.status === 'insufficient_points') {
        return axiosErr.response.data;
      }
      throw err;
    }
  },

  // ─── Multi-gateway lifecycle ─────────────────────────────────────────────
  // The naming is deliberately gateway-agnostic — the same endpoints route
  // through `PaymentMethod::gateway()` server-side and call the right
  // implementation (Flutterwave hosted checkout OR Stripe PaymentIntent).

  /**
   * Initiate a payment and receive either :
   *  - a hosted-checkout URL (`gateway === 'flutterwave'`), or
   *  - a PaymentIntent client secret in `payment_link` (`gateway === 'stripe'`).
   *
   * The persisted `tx_ref` doubles as our cross-gateway lookup key — used
   * by `verify()` and `cancel()` regardless of the gateway.
   */
  async initiate(
    payload: FlutterwaveInitiatePayload
  ): Promise<FlutterwaveInitiateResponse> {
    rememberPaymentOriginPath();
    const { data } = await api.post('/payments/initiate_payment', payload);
    return data as FlutterwaveInitiateResponse;
  },

  /**
   * Verify a payment with the gateway and grant credits / unlocks if paid.
   * Idempotent — safe to retry. The backend uses a row lock to avoid
   * double-spending. Used :
   *  - by the Flutterwave callback page after the user returns from checkout
   *  - by the Stripe flow after `confirmPayment` succeeds, to fast-track
   *    the optimistic UI without waiting for the webhook
   */
  async verify(txRef: string): Promise<FlutterwaveVerifyResponse> {
    const { data } = await api.post('/payments/verify_payment', {
      tx_ref: txRef,
    });
    return data as FlutterwaveVerifyResponse;
  },

  /**
   * Cancel a pending payment on user request. Marks the local row as
   * `cancelled` ; on Stripe, the PaymentIntent stays in
   * `requires_payment_method` until it auto-expires (no webhook side-effect
   * because our handler ignores cancelled rows).
   */
  async cancel(txRef: string): Promise<{ message: string; status: string }> {
    const { data } = await api.post('/payments/cancel_payment', {
      tx_ref: txRef,
    });
    return data;
  },

  /**
   * Public payment status — works WITHOUT auth, returns ONLY the status.
   *
   * Used by the post-checkout callback page as a session-loss-resilient
   * fallback. Knowing the `tx_ref` is sufficient to read the status; no PII
   * is ever exposed. The endpoint returns `{ status: 'unknown' }` (not 404)
   * for missing/invalid references so callers can poll uniformly.
   */
  async publicStatus(txRef: string): Promise<{
    status:
      | 'pending'
      | 'success'
      | 'failed'
      | 'cancelled'
      | 'refunded'
      | 'unknown';
  }> {
    const { data } = await api.get(
      `/payments/${encodeURIComponent(txRef)}/public-status`
    );
    return data;
  },

  // Legacy aliases — kept temporarily for backward compatibility with any
  // call site that still uses the Flutterwave-prefixed names. Prefer the
  // gateway-agnostic helpers above.
  flutterwaveInitiate(
    payload: FlutterwaveInitiatePayload
  ): Promise<FlutterwaveInitiateResponse> {
    return this.initiate(payload);
  },
  flutterwaveVerify(txRef: string): Promise<FlutterwaveVerifyResponse> {
    return this.verify(txRef);
  },
  flutterwaveCancel(
    txRef: string
  ): Promise<{ message: string; status: string }> {
    return this.cancel(txRef);
  },

  /**
   * Download the authenticated user's full payment history as a branded PDF.
   * Opens a browser download dialog with the generated file.
   *
   * @param period - Number of days to include (30 | 90 | 365 | undefined = all)
   * @param currency - ISO currency code of the visitor (e.g. 'CHF') so the
   *   PDF renders the local amount as primary and the XAF canonical value
   *   as a reference subtitle. Falls back to XAF when omitted.
   * @param rate - Conversion rate from 1 XAF to `currency` (e.g. 0.0014
   *   for CHF). Required when `currency` is non-XAF, otherwise ignored.
   */
  async exportPdf(
    period?: 30 | 90 | 365,
    currency?: string,
    rate?: number
  ): Promise<void> {
    const params: Record<string, string> = {};
    if (period) params['period'] = String(period);
    if (
      currency &&
      currency !== 'XAF' &&
      currency !== 'XOF' &&
      typeof rate === 'number' &&
      Number.isFinite(rate) &&
      rate > 0
    ) {
      params['currency'] = currency;
      params['rate'] = String(rate);
    }

    const response = await api.get('/payments/export', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyhome-paiements-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Get the authenticated user's payment history (all gateways).
   */
  async getHistory(page = 1): Promise<{
    data: PaymentHistoryItem[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const { data } = await api.get('/payments/history', { params: { page } });
    return data;
  },
};
