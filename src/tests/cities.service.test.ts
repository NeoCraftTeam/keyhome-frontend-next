import type { Mock } from 'vitest';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from '@/lib/api';
import {
  adTypesService,
  citiesService,
  quartersService,
} from '@/services/cities.service';

const mockedApi = vi.mocked(api);
const mockGet = mockedApi.get as Mock;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('citiesService', () => {
  describe('list', () => {
    // BUG CATCH: City listing feeds the registration and ad creation forms.
    // If it fails silently, users can't select a city.
    it('fetches cities with search and pagination params', async () => {
      const response = {
        data: [
          { id: '1', name: 'Yaoundé' },
          { id: '2', name: 'Douala' },
        ],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 50,
          total: 2,
          from: 1,
          to: 2,
        },
        links: {
          first: '/cities?page=1',
          last: '/cities?page=1',
          prev: null,
          next: null,
        },
      };
      mockGet.mockResolvedValue({ data: response });

      const result = await citiesService.list({ q: 'Yao', page: 1 });

      expect(mockGet).toHaveBeenCalledWith('/cities', {
        params: { q: 'Yao', page: 1 },
      });
      expect(result.data).toHaveLength(2);
    });

    it('works without params', async () => {
      mockGet.mockResolvedValue({ data: { data: [], meta: {}, links: {} } });
      await citiesService.list();
      expect(mockGet).toHaveBeenCalledWith('/cities', { params: undefined });
    });

    it('deduplicates equivalent OSM city representations in autocomplete results', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: [
            {
              id: 'node-bremen',
              name: 'Bremen',
              admin_area: 'Bremen',
              country_code: 'DE',
              place_type: 'city',
            },
            {
              id: 'relation-bremen',
              name: 'Bremen',
              admin_area: 'Bremen',
              country_code: 'DE',
              place_type: 'city',
            },
          ],
          meta: {},
          links: {},
        },
      });

      const result = await citiesService.list({ q: 'Bremen' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('node-bremen');
    });
  });

  describe('show', () => {
    // BUG CATCH: Must unwrap data.data or city detail will be the wrapper object.
    it('unwraps city data from response', async () => {
      mockGet.mockResolvedValue({
        data: { data: { id: '1', name: 'Yaoundé' } },
      });
      const city = await citiesService.show('1');
      expect(city.name).toBe('Yaoundé');
    });

    it('propagates errors for invalid city ID', async () => {
      mockGet.mockRejectedValue(new AxiosError('Not Found', '404'));
      await expect(citiesService.show('nonexistent')).rejects.toThrow();
    });
  });
});

describe('quartersService', () => {
  describe('list', () => {
    it('fetches quarters with pagination', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: [
            { id: '1', name: 'Bastos', city_id: '1', city_name: 'Yaoundé' },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 50,
            total: 1,
            from: 1,
            to: 1,
          },
          links: {
            first: '/quarters?page=1',
            last: '/quarters?page=1',
            prev: null,
            next: null,
          },
        },
      });

      const result = await quartersService.list({ page: 1 });
      expect(result.data[0].name).toBe('Bastos');
    });
  });

  describe('show', () => {
    it('unwraps quarter data', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: { id: '1', name: 'Bastos', city_id: '1', city_name: 'Yaoundé' },
        },
      });
      const quarter = await quartersService.show('1');
      expect(quarter.city_name).toBe('Yaoundé');
    });
  });
});

describe('adTypesService', () => {
  describe('list', () => {
    // BUG CATCH: Ad types populate the type filter dropdown. If empty,
    // users can't filter by property type.
    it('fetches and unwraps ad types', async () => {
      mockGet.mockResolvedValue({
        data: {
          data: [
            { id: '1', name: 'Appartement', desc: 'Apartment' },
            { id: '2', name: 'Maison', desc: 'House' },
            { id: '3', name: 'Terrain', desc: 'Land' },
          ],
        },
      });

      const result = await adTypesService.list();
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Appartement');
    });
  });

  describe('show', () => {
    it('unwraps single ad type', async () => {
      mockGet.mockResolvedValue({
        data: { data: { id: '1', name: 'Appartement', desc: 'Apartment' } },
      });
      const adType = await adTypesService.show('1');
      expect(adType.desc).toBe('Apartment');
    });
  });
});
