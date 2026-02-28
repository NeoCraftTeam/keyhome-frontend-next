import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
import { paymentsService } from '@/services/payments.service';

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('paymentsService', () => {
  describe('initialize', () => {
    // BUG CATCH: Payment initialization returns a URL to redirect the user
    // to FedaPay. If payment_url is missing or wrong, the user can't pay.
    it('returns payment URL and transaction ID', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          payment_url: 'https://checkout.fedapay.com/tx/abc123',
          transaction_id: 'txn_abc123',
        },
      });

      const result = await paymentsService.initialize('ad-uuid-123');

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/initialize/ad-uuid-123');
      expect(result.payment_url).toBe('https://checkout.fedapay.com/tx/abc123');
      expect(result.transaction_id).toBe('txn_abc123');
    });

    // BUG CATCH: If the user isn't authenticated or the ad doesn't exist,
    // the payment initialization fails. The error must propagate so the
    // UI can show an appropriate message.
    it('propagates errors (e.g., unauthenticated or invalid ad)', async () => {
      mockedApi.post.mockRejectedValue(new AxiosError('Unauthorized', '401'));
      await expect(paymentsService.initialize('bad-id')).rejects.toThrow();
    });
  });

  describe('verify', () => {
    // BUG CATCH: After FedaPay callback, the frontend verifies the payment.
    // If is_unlocked is not returned correctly, the UI doesn't reveal
    // premium contact info even though the user paid.
    it('returns unlock status after payment verification', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          is_unlocked: true,
          message: 'Annonce déverrouillée avec succès.',
        },
      });

      const result = await paymentsService.verify('ad-uuid-123');

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/verify/ad-uuid-123');
      expect(result.is_unlocked).toBe(true);
    });

    // BUG CATCH: Payment might still be pending (webhook not received yet).
    it('handles not-yet-unlocked state', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          is_unlocked: false,
          message: 'Paiement en cours de traitement.',
        },
      });

      const result = await paymentsService.verify('ad-uuid-123');
      expect(result.is_unlocked).toBe(false);
    });
  });

  describe('getUnlockPrice', () => {
    // BUG CATCH: If unlock_price isn't extracted correctly from the response,
    // the price displayed to users is undefined/NaN, destroying trust.
    it('extracts unlock_price from response', async () => {
      mockedApi.get.mockResolvedValue({
        data: { unlock_price: 500 },
      });

      const price = await paymentsService.getUnlockPrice();

      expect(mockedApi.get).toHaveBeenCalledWith('/payments/unlock-price');
      expect(price).toBe(500);
    });

    // BUG CATCH: Network/auth errors must propagate, not return NaN.
    it('propagates errors', async () => {
      mockedApi.get.mockRejectedValue(new AxiosError('Server Error'));
      await expect(paymentsService.getUnlockPrice()).rejects.toThrow();
    });
  });
});
