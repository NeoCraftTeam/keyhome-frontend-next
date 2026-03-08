import api from '@/lib/api';
import {
  FlutterwaveInitiatePayload,
  FlutterwaveInitiateResponse,
  FlutterwaveVerifyResponse,
  PaymentHistoryItem,
  UnlockResponse,
} from '@/types';

export const paymentsService = {
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

  // ─── Flutterwave ─────────────────────────────────────────────────────────

  /**
   * Initiate a Flutterwave payment and receive a hosted checkout link.
   */
  async flutterwaveInitiate(
    payload: FlutterwaveInitiatePayload,
  ): Promise<FlutterwaveInitiateResponse> {
    const { data } = await api.post('/payments/initiate_payment', payload);
    return data as FlutterwaveInitiateResponse;
  },

  /**
   * Verify a Flutterwave payment after the user returns from checkout.
   */
  async flutterwaveVerify(txRef: string): Promise<FlutterwaveVerifyResponse> {
    const { data } = await api.post('/payments/verify_payment', { tx_ref: txRef });
    return data as FlutterwaveVerifyResponse;
  },

  /**
   * Cancel a pending Flutterwave payment.
   */
  async flutterwaveCancel(txRef: string): Promise<{ message: string; status: string }> {
    const { data } = await api.post('/payments/cancel_payment', { tx_ref: txRef });
    return data;
  },

  /**
   * Get the authenticated user's payment history (all gateways).
   */
  async getHistory(page = 1): Promise<{ data: PaymentHistoryItem[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const { data } = await api.get('/payments/history', { params: { page } });
    return data;
  },
};


