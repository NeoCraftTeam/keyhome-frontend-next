import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '@/lib/api';
import { recommendationsService, unlockedAdsService, usersService } from '@/services/users.service';

const mockedApi = vi.mocked(api);

const mockUser = {
  id: 'user-abc-123',
  firstname: 'Amina',
  lastname: 'Bello',
  phone_number: '+237677001122',
  email: 'amina.bello@example.cm',
  avatar: 'https://cdn.keyhome.app/avatars/amina.webp',
  display_name: 'Amina Bello',
  agency_name: null,
  role: 'customer',
  type: 'individual',
  city_id: '2',
  city_name: 'Douala',
};

const mockAd = {
  id: 'ad-recommend-1',
  title: 'Villa 4 pièces à Bonamoussadi',
  slug: 'villa-4-pieces-bonamoussadi',
  price: 450000,
  status: 'available',
  images: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usersService', () => {
  describe('list', () => {
    it('fetches paginated user list', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: [mockUser],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
          links: { first: '/users?page=1', last: '/users?page=1', prev: null, next: null },
        },
      });

      const result = await usersService.list({ page: 1 });

      expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: { page: 1 } });
      expect(result.data[0].firstname).toBe('Amina');
    });

    it('works without params', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [], meta: {}, links: {} } });
      await usersService.list();
      expect(mockedApi.get).toHaveBeenCalledWith('/users', { params: undefined });
    });
  });

  describe('show', () => {
    // BUG CATCH: Must unwrap data.data for user profile pages.
    it('unwraps user data from response', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: mockUser } });
      const user = await usersService.show('user-abc-123');
      expect(user.display_name).toBe('Amina Bello');
    });

    it('falls back to raw data', async () => {
      mockedApi.get.mockResolvedValue({ data: mockUser });
      const user = await usersService.show('user-abc-123');
      expect(user.email).toBe('amina.bello@example.cm');
    });
  });

  describe('update', () => {
    // BUG CATCH: User update uses POST + _method=PUT (same as ad update)
    // because avatar upload requires multipart/form-data.
    it('appends _method=PUT and sends multipart FormData', async () => {
      const formData = new FormData();
      formData.append('firstname', 'Amina');
      formData.append('lastname', 'Bello-Nguema');

      mockedApi.post.mockResolvedValue({ data: { user: { ...mockUser, lastname: 'Bello-Nguema' } } });

      const result = await usersService.update('user-abc-123', formData);

      expect(formData.get('_method')).toBe('PUT');
      expect(mockedApi.post).toHaveBeenCalledWith('/users/user-abc-123', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result.lastname).toBe('Bello-Nguema');
    });

    // BUG CATCH: The update response can be wrapped as `data.user`, `data.data`,
    // or raw `data`. The triple fallback chain must be tested.
    it('unwraps from data.data when data.user is absent', async () => {
      const formData = new FormData();
      mockedApi.post.mockResolvedValue({ data: { data: mockUser } });
      const result = await usersService.update('user-abc-123', formData);
      expect(result.firstname).toBe('Amina');
    });

    it('falls back to raw data when both data.user and data.data are absent', async () => {
      const formData = new FormData();
      mockedApi.post.mockResolvedValue({ data: mockUser });
      const result = await usersService.update('user-abc-123', formData);
      expect(result.firstname).toBe('Amina');
    });
  });
});

describe('recommendationsService', () => {
  describe('list', () => {
    // BUG CATCH: Recommendations return both data (ads) and meta (source).
    // If we only return data, the UI can't display the recommendation algorithm
    // source (e.g. "collaborative filtering" vs "trending").
    it('returns ads and meta with source', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: [mockAd],
          meta: { source: 'collaborative_filtering' },
        },
      });

      const result = await recommendationsService.list();

      expect(mockedApi.get).toHaveBeenCalledWith('/recommendations');
      expect(result.data).toHaveLength(1);
      expect(result.meta.source).toBe('collaborative_filtering');
    });

    // BUG CATCH: If the recommendation engine has no data, it should return
    // an empty array, not crash.
    it('handles empty recommendations', async () => {
      mockedApi.get.mockResolvedValue({
        data: { data: [], meta: { source: 'fallback_popular' } },
      });

      const result = await recommendationsService.list();
      expect(result.data).toHaveLength(0);
    });
  });
});

describe('unlockedAdsService', () => {
  describe('list', () => {
    it('unwraps ads from data.data', async () => {
      mockedApi.get.mockResolvedValue({
        data: { data: [mockAd] },
      });

      const result = await unlockedAdsService.list();

      expect(mockedApi.get).toHaveBeenCalledWith('/my/unlocked-ads');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Villa 4 pièces à Bonamoussadi');
    });

    it('falls back to raw data when not wrapped', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockAd] });
      const result = await unlockedAdsService.list();
      expect(result).toHaveLength(1);
    });

    it('propagates errors', async () => {
      mockedApi.get.mockRejectedValue(new AxiosError('Unauthenticated'));
      await expect(unlockedAdsService.list()).rejects.toThrow();
    });
  });
});


