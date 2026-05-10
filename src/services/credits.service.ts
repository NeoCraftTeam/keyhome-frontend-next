import api from '@/lib/api';
import { rememberPaymentOriginPath } from '@/lib/payment-return';
import {
  CreditPurchaseResponse,
  CreditVerifyResponse,
  PointPackage,
} from '@/types';

type ResourceCollection<T> = {
  data?: T[];
};

export const creditsService = {
  async listPackages(): Promise<PointPackage[]> {
    const response = await api.get('/credits/packages');
    const payload = response.data as
      | PointPackage[]
      | ResourceCollection<PointPackage>;

    if (Array.isArray(payload)) {
      return payload;
    }

    return Array.isArray(payload?.data) ? payload.data : [];
  },

  async getPackages(): Promise<PointPackage[]> {
    return this.listPackages();
  },

  /** Return the authenticated user's current point balance. */
  async getBalance(): Promise<number> {
    const { data } = await api.get('/credits/balance');
    return data.point_balance as number;
  },

  /**
   * Initiate a Flutterwave checkout to purchase a point package.
   * Returns the payment URL to redirect the user to.
   */
  async purchase(
    packageId: string,
    callbackUrl?: string
  ): Promise<CreditPurchaseResponse> {
    rememberPaymentOriginPath();
    const { data } = await api.post(`/credits/purchase/${packageId}`, {
      callback_url: callbackUrl,
    });
    return data;
  },

  /**
   * Verify a credit purchase and return updated balance.
   *
   * Pass the `tx_ref` returned by `purchase()` so the backend targets the
   * exact payment created in this checkout session (the legacy "latest" lookup
   * could race with concurrent purchases or stale rows). Omitting it falls
   * back to "latest credit purchase" for backward compatibility.
   */
  async verifyPurchase(txRef?: string | null): Promise<CreditVerifyResponse> {
    const { data } = await api.post(
      '/credits/verify-purchase',
      txRef ? { tx_ref: txRef } : {}
    );
    return data;
  },
};
