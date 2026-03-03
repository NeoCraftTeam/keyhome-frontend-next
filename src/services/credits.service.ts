import api from '@/lib/api';
import { CreditPurchaseResponse, CreditVerifyResponse, PointPackage } from '@/types';

export const creditsService = {
  /** List all active point packages. */
  async getPackages(): Promise<PointPackage[]> {
    const { data } = await api.get('/credits/packages');
    return data.data ?? data;
  },

  /** Return the authenticated user's current point balance. */
  async getBalance(): Promise<number> {
    const { data } = await api.get('/credits/balance');
    return data.point_balance as number;
  },

  /**
   * Initiate a FedaPay checkout to purchase a point package.
   * Returns the payment URL to redirect the user to.
   */
  async purchase(
    packageId: string,
    callbackUrl?: string,
  ): Promise<CreditPurchaseResponse> {
    const { data } = await api.post(`/credits/purchase/${packageId}`, {
      callback_url: callbackUrl,
    });
    return data;
  },

  /**
   * Verify the most recent credit purchase and return updated balance.
   */
  async verifyPurchase(): Promise<CreditVerifyResponse> {
    const { data } = await api.post('/credits/verify-purchase');
    return data;
  },
};
