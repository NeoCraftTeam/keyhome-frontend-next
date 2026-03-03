import api from '@/lib/api';
import { UnlockResponse } from '@/types';

export const paymentsService = {
  /**
   * Attempt to unlock an ad.
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

  async verify(adId: string): Promise<{ is_unlocked: boolean; message: string }> {
    const { data } = await api.post(`/payments/verify/${adId}`);
    return data;
  },

  /** Get the unlock cost in points. */
  async getUnlockCost(): Promise<{ unlock_cost_points: number }> {
    const { data } = await api.get('/payments/unlock-price');
    return data;
  },
};

