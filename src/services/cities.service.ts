import api from '@/lib/api';
import { AdType, City, PaginatedResponse, Quarter } from '@/types';

export const citiesService = {
  async list(params?: {
    q?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<City>> {
    const { data } = await api.get('/cities', { params });
    return data;
  },

  async show(id: string): Promise<City> {
    const { data } = await api.get(`/cities/${id}`);
    return data.data ?? data;
  },
};

export const quartersService = {
  async list(params?: {
    page?: number;
    per_page?: number;
    city_id?: string;
    q?: string;
  }): Promise<PaginatedResponse<Quarter>> {
    const { data } = await api.get('/quarters', { params });
    return data;
  },

  async show(id: string): Promise<Quarter> {
    const { data } = await api.get(`/quarters/${id}`);
    return data.data ?? data;
  },
};

export const adTypesService = {
  async list(): Promise<AdType[]> {
    const { data } = await api.get('/ad-types');
    return data.data ?? data;
  },

  async show(id: string): Promise<AdType> {
    const { data } = await api.get(`/ad-types/${id}`);
    return data.data ?? data;
  },
};
