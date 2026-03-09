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
    // to Flutterwave. If payment_url is missing or wrong, the user can't pay.
    it('returns payment URL and transaction ID', async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          payment_url: 'https://checkout.flutterwave.com/pay/abc123',
          transaction_id: 'txn_abc123',
        },
      });

      const result = await paymentsService.initialize('ad-uuid-123');

      expect(mockedApi.post).toHaveBeenCalledWith('/payments/initialize/ad-uuid-123');
      expect(result.payment_url).toBe('https://checkout.flutterwave.com/pay/abc123');
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
});
