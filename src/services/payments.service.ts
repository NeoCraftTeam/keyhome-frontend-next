import api from '@/lib/api';
import { rememberPaymentOriginPath } from '@/lib/payment/payment-return';
import {
  PaginatedResponse,
  PaymentHistoryItem,
  PaymentInitiatePayload,
  PaymentInitiateResponse,
  PaymentMethodInfo,
  PaymentVerifyResponse,
  StripePaymentMethod,
  StripeSetupIntent,
  UnlockResponse,
  UserRefund,
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
  // implementation (Kpay hosted checkout OR Stripe PaymentIntent).

  /**
   * Initiate a payment and receive either :
   *  - a hosted-checkout URL (`gateway === 'kpay'`), or
   *  - a PaymentIntent client secret in `payment_link` (`gateway === 'stripe'`).
   *
   * The persisted `tx_ref` doubles as our cross-gateway lookup key — used
   * by `verify()` and `cancel()` regardless of the gateway.
   */
  async initiate(
    payload: PaymentInitiatePayload
  ): Promise<PaymentInitiateResponse> {
    rememberPaymentOriginPath();
    const { data } = await api.post('/payments/initiate_payment', payload);
    return data as PaymentInitiateResponse;
  },

  /**
   * Verify a payment with the gateway and grant credits / unlocks if paid.
   * Idempotent — safe to retry. The backend uses a row lock to avoid
   * double-spending. Used :
   *  - by the callback page after the user returns from hosted checkout
   *  - by the Stripe flow after `confirmPayment` succeeds, to fast-track
   *    the optimistic UI without waiting for the webhook
   */
  async verify(
    txRef?: string | null,
    gatewayReference?: string | null
  ): Promise<PaymentVerifyResponse> {
    const body: { tx_ref?: string; reference?: string } = {};
    if (txRef) {
      body.tx_ref = txRef;
    }
    if (gatewayReference) {
      body.reference = gatewayReference;
    }
    const { data } = await api.post('/payments/verify_payment', body);
    return data as PaymentVerifyResponse;
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
  async publicStatus(txRefOrReference: string): Promise<{
    status:
      | 'pending'
      | 'success'
      | 'failed'
      | 'cancelled'
      | 'refunded'
      | 'unknown';
  }> {
    const { data } = await api.get(
      `/payments/${encodeURIComponent(txRefOrReference)}/public-status`
    );
    return data;
  },

  async requestRefund(
    paymentId: string,
    reason: string
  ): Promise<{ message: string; refund_id: string }> {
    const { data } = await api.post(`/payments/${paymentId}/refund-request`, {
      reason,
    });
    return data;
  },

  async fetchRefunds(page = 1): Promise<PaginatedResponse<UserRefund>> {
    const { data } = await api.get<PaginatedResponse<UserRefund>>(
      '/payments/refunds',
      { params: { page } }
    );
    return data;
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
   * Length-aware paginated payment history (`GET /api/v1/payments/history`).
   *
   * Client tables use TanStack Query with `paymentKeys.list(perPage, page)` (`src/lib/query-keys.ts`).
   */
  async getHistory(options?: {
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<PaymentHistoryItem>> {
    const params: Record<string, string | number> = {
      per_page: options?.perPage ?? 10,
      page: options?.page ?? 1,
    };

    // Return full Laravel `{ data, meta, links }` — callers need meta for Pagination.
    const res = await api.get<PaginatedResponse<PaymentHistoryItem>>(
      '/payments/history',
      { params }
    );
    return res.data;
  },

  /**
   * Open a single-transaction receipt in a new tab (`auth:sanctum`).
   * Uses blob + object URL because the route requires credentials (Bearer /
   * Sanctum cookie); `window.open(apiUrl)` would not send auth and popups
   * with opaque URLs are unreliable.
   */
  async downloadReceipt(
    paymentId: string,
    options?: { currency?: string; rate?: number }
  ): Promise<void> {
    const params: Record<string, string> = {};
    if (
      options?.currency &&
      options.currency !== 'XAF' &&
      options.currency !== 'XOF' &&
      typeof options.rate === 'number' &&
      Number.isFinite(options.rate) &&
      options.rate > 0
    ) {
      params.currency = options.currency;
      params.rate = String(options.rate);
    }

    const response = await api.get(
      `/payments/${encodeURIComponent(paymentId)}/receipt`,
      {
        params,
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data as BlobPart], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const child = window.open(url, '_blank', 'noopener,noreferrer');
    if (!child) {
      const a = document.createElement('a');
      a.href = url;
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      a.click();
    }
    // Blob URL must stay valid while the new tab loads the PDF; revoke later.
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  },

  // ─── Stripe saved cards ──────────────────────────────────────────────
  // All endpoints below require `auth:sanctum` and target the authenticated
  // user's Stripe Customer (managed via Cashier `Billable`).

  /**
   * List the authenticated user's saved Stripe cards.
   *
   * Returns `[]` when the user has no Stripe Customer attached yet (typical
   * for users who never paid by card). Backed by
   * `GET /payments/stripe/payment-methods` (`StripePaymentMethodController::index`).
   */
  async listStripePaymentMethods(): Promise<StripePaymentMethod[]> {
    const { data } = await api.get<{ data: StripePaymentMethod[] }>(
      '/payments/stripe/payment-methods'
    );
    return data.data ?? [];
  },

  /**
   * Detach a previously saved Stripe card from the authenticated user.
   *
   * Idempotent server-side (a 404 from Stripe is silently swallowed).
   * The card is removed from the Customer's payment methods AND, if it was
   * marked as default, the default slot is cleared.
   */
  async deleteStripePaymentMethod(
    paymentMethodId: string
  ): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(
      `/payments/stripe/payment-methods/${encodeURIComponent(paymentMethodId)}`
    );
    return data;
  },

  /**
   * Mark a saved Stripe card as the default one (sets
   * `invoice_settings.default_payment_method` on the Customer). The default
   * card is the one the saved-card selector auto-selects on next payment.
   */
  async setDefaultStripePaymentMethod(
    paymentMethodId: string
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      `/payments/stripe/payment-methods/${encodeURIComponent(paymentMethodId)}/set-default`
    );
    return data;
  },

  /**
   * Create a Stripe SetupIntent so the user can save a new card *without*
   * paying. Returned `client_secret` is consumed by `<Elements>` +
   * `<CardElement>` (or `<PaymentElement>` in setup mode) on the frontend.
   *
   * Used by the profile "Ajouter une carte" CTA — distinct from the
   * `initiate_payment` flow which always charges the user.
   */
  async createStripeSetupIntent(): Promise<StripeSetupIntent> {
    const { data } = await api.post<{ data: StripeSetupIntent }>(
      '/payments/stripe/setup-intent'
    );
    return data.data;
  },

  async notifyCardAdded(): Promise<void> {
    await api.post('/payments/stripe/payment-methods/notify-added');
  },
};
