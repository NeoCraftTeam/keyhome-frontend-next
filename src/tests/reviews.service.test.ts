import type { Mock } from 'vitest';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
import { reviewsService } from '@/services/reviews.service';

const mockedApi = vi.mocked(api);
const mockPost = mockedApi.post as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reviewsService', () => {
  describe('create', () => {
    // BUG CATCH: Review creation sends rating, comment, and ad_id.
    // If any field is missing, Laravel returns 422 validation error.
    it('sends review payload with rating, comment, and ad_id', async () => {
      const reviewResponse = {
        id: 'review-123',
        rating: 4,
        comment: 'Bel appartement, bien situé. Propriétaire réactif.',
        user: { id: 'user-1', name: 'Jean D.', avatar: null },
        created_at: '2026-02-28T12:00:00Z',
      };
      mockPost.mockResolvedValue({ data: reviewResponse });

      const payload = {
        rating: 4,
        comment: 'Bel appartement, bien situé. Propriétaire réactif.',
        ad_id: 'ad-uuid-456',
      };

      const result = await reviewsService.create(payload);

      expect(mockPost).toHaveBeenCalledWith('/reviews', payload);
      expect(result.rating).toBe(4);
    });

    // BUG CATCH: Comments are optional. If the service breaks without
    // a comment, users can't submit rating-only reviews.
    it('allows review without comment (rating only)', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'review-456', rating: 5, comment: null },
      });

      const payload = {
        rating: 5,
        ad_id: 'ad-uuid-789',
      };

      const result = await reviewsService.create(payload);
      expect(result.rating).toBe(5);
      expect(result.comment).toBeNull();
    });

    // BUG CATCH: If review creation fails (e.g., duplicate review,
    // unauthenticated), the error must propagate to show a toast.
    it('propagates validation errors', async () => {
      mockPost.mockRejectedValue(new AxiosError('Unprocessable Entity', '422'));
      await expect(
        reviewsService.create({ rating: 6, ad_id: 'ad-1' })
      ).rejects.toThrow();
    });

    it('propagates authentication errors', async () => {
      mockPost.mockRejectedValue(new AxiosError('Unauthenticated', '401'));
      await expect(
        reviewsService.create({ rating: 3, ad_id: 'ad-1' })
      ).rejects.toThrow();
    });
  });
});
