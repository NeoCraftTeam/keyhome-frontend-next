import type { Mock } from 'vitest';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the api module so no real HTTP calls are made
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/lib/api';
import { adsService } from '@/services/ads.service';

const mockedApi = vi.mocked(api);
const mockGet = mockedApi.get as Mock;
const mockPost = mockedApi.post as Mock;
const mockDelete = mockedApi.delete as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

// Realistic test data matching the actual Laravel backend response shape
const mockAd = {
  id: '9e5f2a3b-1c4d-4e6f-8a7b-2d3e4f5a6b7c',
  title: 'Appartement T3 meublé à Bastos',
  slug: 'appartement-t3-meuble-bastos',
  description: 'Bel appartement de 3 pièces dans le quartier chic de Bastos',
  adresse: 'Rue 1.723, Bastos, Yaoundé',
  price: 250000,
  surface_area: 85,
  bedrooms: 3,
  bathrooms: 2,
  has_parking: true,
  status: 'available',
  created_at: '2026-01-15T10:30:00Z',
  updated_at: '2026-01-15T10:30:00Z',
  images: [],
  user: null,
  agency: null,
  published_by: 'agent',
  quarter: { id: '1', name: 'Bastos', city_id: '1', city_name: 'Yaoundé' },
  type: { id: '1', name: 'Appartement', desc: 'Apartment' },
  location: { latitude: 3.886, longitude: 11.517 },
  expires_at: null,
};

const mockPaginatedResponse = {
  data: [mockAd],
  meta: {
    current_page: 1,
    last_page: 3,
    per_page: 15,
    total: 42,
    from: 1,
    to: 15,
  },
  links: {
    first: '/ads?page=1',
    last: '/ads?page=3',
    prev: null,
    next: '/ads?page=2',
  },
};

describe('adsService', () => {
  describe('list', () => {
    // BUG CATCH: If list() doesn't pass params, pagination and filtering break.
    it('fetches ads with pagination params', async () => {
      mockGet.mockResolvedValue({ data: mockPaginatedResponse });
      const params = { page: 2, per_page: 10, type: 'rent' };

      const result = await adsService.list(params);

      expect(mockGet).toHaveBeenCalledWith('/ads', { params });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(42);
    });

    // BUG CATCH: list() with no params must still work (homepage default listing).
    it('fetches ads with no params (default listing)', async () => {
      mockGet.mockResolvedValue({ data: mockPaginatedResponse });
      await adsService.list();
      expect(mockGet).toHaveBeenCalledWith('/ads', { params: undefined });
    });

    // BUG CATCH: If api errors are swallowed, the UI shows empty lists
    // instead of error messages.
    it('propagates API errors', async () => {
      mockGet.mockRejectedValue(new AxiosError('Network Error'));
      await expect(adsService.list()).rejects.toThrow('Network Error');
    });
  });

  describe('show', () => {
    // BUG CATCH: Laravel wraps responses in { data: ... }. If show() returns
    // the wrapper instead of unwrapping, ad detail pages show nothing.
    it('unwraps data.data from Laravel resource response', async () => {
      mockGet.mockResolvedValue({ data: { data: mockAd } });
      const result = await adsService.show(
        '9e5f2a3b-1c4d-4e6f-8a7b-2d3e4f5a6b7c'
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/ads/9e5f2a3b-1c4d-4e6f-8a7b-2d3e4f5a6b7c'
      );
      expect(result.title).toBe('Appartement T3 meublé à Bastos');
    });

    // BUG CATCH: Some endpoints return raw data (no wrapper). The ?? fallback
    // ensures both response shapes work.
    it('falls back to raw data when data.data is undefined', async () => {
      mockGet.mockResolvedValue({ data: mockAd });
      const result = await adsService.show('test-id');
      expect(result.title).toBe('Appartement T3 meublé à Bastos');
    });
  });

  describe('search', () => {
    // BUG CATCH: Search must pass all filter params to the API.
    // If params are dropped, users get unfiltered results.
    it('passes search params correctly', async () => {
      mockGet.mockResolvedValue({ data: mockPaginatedResponse });
      const searchParams = {
        q: 'appartement',
        city: 'Yaoundé',
        price_min: 100000,
        price_max: 500000,
        bedrooms: 2,
        has_parking: true,
      };

      await adsService.search(searchParams);

      expect(mockGet).toHaveBeenCalledWith('/ads/search', {
        params: searchParams,
      });
    });
  });

  describe('nearby', () => {
    // BUG CATCH: If coordinates aren't passed, the backend returns 422.
    it('passes latitude and longitude params', async () => {
      mockGet.mockResolvedValue({ data: { data: [mockAd] } });
      const params = { latitude: 3.848, longitude: 11.502, radius: 5 };

      const result = await adsService.nearby(params);

      expect(mockGet).toHaveBeenCalledWith('/ads/nearby', { params });
      expect(result).toHaveLength(1);
    });
  });

  describe('nearbyForUser', () => {
    // BUG CATCH: User-specific nearby uses a different endpoint with userId in path.
    it('constructs URL with userId', async () => {
      mockGet.mockResolvedValue({ data: { data: [mockAd] } });
      const params = { latitude: 3.848, longitude: 11.502 };

      await adsService.nearbyForUser('user-123', params);

      expect(mockGet).toHaveBeenCalledWith('/ads/user-123/nearby', { params });
    });
  });

  describe('autocomplete', () => {
    // BUG CATCH: If field and q params aren't sent, autocomplete returns nothing.
    it('sends field and query parameters', async () => {
      const results = [
        { value: 'Yaoundé', count: 15 },
        { value: 'Yaounde', count: 3 },
      ];
      mockGet.mockResolvedValue({ data: { data: results } });

      const result = await adsService.autocomplete('city', 'Yao');

      expect(mockGet).toHaveBeenCalledWith('/ads/autocomplete', {
        params: { field: 'city', q: 'Yao' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('facets', () => {
    // BUG CATCH: Facets feed the search filters UI. If the response isn't
    // unwrapped, filters show no options.
    it('returns facets data', async () => {
      const facets = {
        cities: [{ name: 'Yaoundé', count: 42 }],
        types: [{ name: 'Appartement', count: 30 }],
        bedrooms: [{ value: 2, count: 15 }],
        price_range: { min: 50000, max: 2000000 },
        surface_range: { min: 20, max: 500 },
        has_parking: { with_parking: 20, without_parking: 22 },
      };
      mockGet.mockResolvedValue({ data: { data: facets } });

      const result = await adsService.facets();
      expect(result.cities).toHaveLength(1);
      expect(result.price_range.min).toBe(50000);
    });
  });

  describe('create', () => {
    // BUG CATCH: Create must use multipart/form-data for image uploads.
    // If Content-Type is wrong, Laravel can't parse the images.
    it('sends FormData with multipart content type', async () => {
      const formData = new FormData();
      formData.append('title', 'Nouvelle annonce');
      formData.append('price', '150000');

      mockPost.mockResolvedValue({ data: { data: mockAd } });

      await adsService.create(formData);

      expect(mockPost).toHaveBeenCalledWith(
        '/ads',
        formData,
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120_000,
        })
      );
    });
  });

  describe('update', () => {
    // BUG CATCH: Laravel doesn't support PUT with multipart/form-data.
    // The _method=PUT spoofing is required. If missing, Laravel returns 405.
    it('appends _method=PUT for Laravel method spoofing', async () => {
      const formData = new FormData();
      formData.append('title', 'Titre modifié');

      mockPost.mockResolvedValue({ data: { data: mockAd } });

      await adsService.update('ad-123', formData);

      // Verify _method was appended
      expect(formData.get('_method')).toBe('PUT');
      // Verify it uses POST (not PUT) endpoint
      expect(mockPost).toHaveBeenCalledWith(
        '/ads/ad-123',
        formData,
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120_000,
        })
      );
    });
  });

  describe('uploadTourScenes', () => {
    it('sends multipart with extended timeout for large panoramas', async () => {
      const file = new File(['x'], 'pano.jpg', { type: 'image/jpeg' });
      mockPost.mockResolvedValue({
        data: { message: 'ok', scenes_count: 1, config: {} },
      });

      await adsService.uploadTourScenes('ad-123', [
        { title: 'Salon', image: file },
      ]);

      expect(mockPost).toHaveBeenCalledWith(
        '/ads/ad-123/tour/scenes',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 600_000,
        })
      );
    });
  });

  describe('destroy', () => {
    // BUG CATCH: If destroy doesn't call DELETE, ads are never removed.
    it('calls DELETE endpoint', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      await adsService.destroy('ad-123');
      expect(mockDelete).toHaveBeenCalledWith('/ads/ad-123');
    });
  });

  describe('trackView', () => {
    // BUG CATCH: trackView is fire-and-forget. If it threw errors,
    // opening any ad detail page could crash on network issues.
    it('calls POST endpoint and does not throw on error', async () => {
      mockPost.mockRejectedValue(new Error('Network Error'));

      // Should not throw — fire and forget
      expect(() => adsService.trackView('ad-123')).not.toThrow();
      expect(mockPost).toHaveBeenCalledWith('/ads/ad-123/view');
    });

    it('calls the correct endpoint for view tracking', () => {
      mockPost.mockResolvedValue({ data: {} });
      adsService.trackView('ad-456');
      expect(mockPost).toHaveBeenCalledWith('/ads/ad-456/view');
    });
  });
});
