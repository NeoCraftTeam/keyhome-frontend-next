import type { Mock } from 'vitest';
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
const mockPost = mockedApi.post as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('paymentsService', () => {
  describe('initialize', () => {
    // BUG CATCH: Unlock with credits returns status. If status is wrong,
    // the UI can't show success or insufficient_points state.
    it('returns unlocked status when user has enough credits', async () => {
      mockPost.mockResolvedValue({
        data: { status: 'unlocked' as const },
      });

      const result = await paymentsService.initialize('ad-uuid-123');

      expect(mockPost).toHaveBeenCalledWith('/payments/initialize/ad-uuid-123');
      expect(result.status).toBe('unlocked');
    });

    // BUG CATCH: If the user isn't authenticated or the ad doesn't exist,
    // the payment initialization fails. The error must propagate so the
    // UI can show an appropriate message.
    it('propagates errors (e.g., unauthenticated or invalid ad)', async () => {
      mockPost.mockRejectedValue(new AxiosError('Unauthorized', '401'));
      await expect(paymentsService.initialize('bad-id')).rejects.toThrow();
    });
  });
});
