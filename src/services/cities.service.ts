import api from '@/lib/api';
import { AdType, City, PaginatedResponse, Quarter } from '@/types';

function uniqueCitiesForAutocomplete(cities: City[]): City[] {
  const seen = new Set<string>();

  return cities.filter((city) => {
    const identity = [
      city.name,
      city.admin_area ?? '',
      city.country_code ?? city.country ?? '',
      city.place_type ?? '',
    ]
      .map((part) => part.trim().toLocaleLowerCase('fr'))
      .join('|');

    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export const citiesService = {
  async list(
    params?: {
      q?: string;
      page?: number;
      per_page?: number;
      country_code?: string;
    },
    config?: { signal?: AbortSignal }
  ): Promise<PaginatedResponse<City>> {
    const { data } = await api.get('/cities', {
      params,
      ...(config?.signal ? { signal: config.signal } : {}),
    });
    return {
      ...data,
      data: uniqueCitiesForAutocomplete(data.data ?? []),
    };
  },

  async show(id: string): Promise<City> {
    const { data } = await api.get(`/cities/${id}`);
    return data.data ?? data;
  },

  async findOrCreate(payload: {
    name: string;
    country?: string;
  }): Promise<{ data: City; created: boolean }> {
    const { data } = await api.post('/geo/city', payload);
    return data;
  },
};

export const quartersService = {
  async list(
    params?: {
      page?: number;
      per_page?: number;
      city_id?: string;
      q?: string;
    },
    config?: { signal?: AbortSignal }
  ): Promise<PaginatedResponse<Quarter>> {
    const { data } = await api.get('/quarters', {
      params,
      ...(config?.signal ? { signal: config.signal } : {}),
    });
    return data;
  },

  async show(id: string): Promise<Quarter> {
    const { data } = await api.get(`/quarters/${id}`);
    return data.data ?? data;
  },

  async findOrCreate(payload: {
    name: string;
    city_id: string;
  }): Promise<{ data: Quarter; created: boolean }> {
    const { data } = await api.post('/geo/quarter', payload);
    return data;
  },
};

export const adTypesService = {
  async list(config?: { signal?: AbortSignal }): Promise<AdType[]> {
    const { data } = await api.get('/ad-types', {
      ...(config?.signal ? { signal: config.signal } : {}),
    });
    return data.data ?? data;
  },

  async show(id: string): Promise<AdType> {
    const { data } = await api.get(`/ad-types/${id}`);
    return data.data ?? data;
  },
};
