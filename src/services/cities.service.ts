import api from '@/lib/api';
import { AdType, City, PaginatedResponse, Quarter } from '@/types';

export const citiesService = {
  async list(
    params?: {
      q?: string;
      page?: number;
      per_page?: number;
    },
    config?: { signal?: AbortSignal }
  ): Promise<PaginatedResponse<City>> {
    const { data } = await api.get('/cities', {
      params,
      ...(config?.signal ? { signal: config.signal } : {}),
    });
    return data;
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
