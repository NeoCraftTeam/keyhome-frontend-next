import api from '@/lib/api';
import {
    Ad,
    AutocompleteResult,
    FacetsResponse,
    NearbyParams,
    PaginatedResponse,
    SearchParams,
} from '@/types';

export const adsService = {
  async list(params?: {
    page?: number;
    per_page?: number;
    order_by?: string;
    direction?: 'asc' | 'desc';
    type?: string;
  }): Promise<PaginatedResponse<Ad>> {
    const { data } = await api.get('/ads', { params });
    return data;
  },

  async show(id: string): Promise<Ad> {
    const { data } = await api.get(`/ads/${id}`);
    return data.data ?? data;
  },

  async search(params: SearchParams): Promise<PaginatedResponse<Ad>> {
    const { data } = await api.get('/ads/search', { params });
    return data;
  },

  async nearby(params: NearbyParams): Promise<Ad[]> {
    const { data } = await api.get('/ads/nearby', { params });
    return data.data ?? data;
  },

  async nearbyForUser(
    userId: string,
    params: NearbyParams
  ): Promise<Ad[]> {
    const { data } = await api.get(`/ads/${userId}/nearby`, { params });
    return data.data ?? data;
  },

  async autocomplete(
    field: 'city' | 'type' | 'quarter',
    q: string
  ): Promise<AutocompleteResult[]> {
    const { data } = await api.get('/ads/autocomplete', {
      params: { field, q },
    });
    return data.data ?? data;
  },

  async facets(): Promise<FacetsResponse> {
    const { data } = await api.get('/ads/facets');
    return data.data ?? data;
  },

  async create(formData: FormData): Promise<Ad> {
    const { data } = await api.post('/ads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data ?? data;
  },

  async update(id: string, formData: FormData): Promise<Ad> {
    // Laravel requires POST + _method for multipart/form-data uploads
    formData.append('_method', 'PUT');
    const { data } = await api.post(`/ads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data ?? data;
  },

  async destroy(id: string): Promise<void> {
    await api.delete(`/ads/${id}`);
  },
};
