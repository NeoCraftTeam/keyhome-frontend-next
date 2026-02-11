import api from '@/lib/api';
import { PaymentInitResponse } from '@/types';

export const paymentsService = {
  async initialize(adId: string): Promise<PaymentInitResponse> {
    const { data } = await api.post(`/payments/initialize/${adId}`);
    return data;
  },
};
