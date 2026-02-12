import api from '@/lib/api';
import { PaymentInitResponse } from '@/types';

export const paymentsService = {
  async initialize(adId: string): Promise<PaymentInitResponse> {
    const { data } = await api.post(`/payments/initialize/${adId}`);
    return data;
  },

  async verify(adId: string): Promise<{ is_unlocked: boolean; message: string }> {
    const { data } = await api.post(`/payments/verify/${adId}`);
    return data;
  },
};
