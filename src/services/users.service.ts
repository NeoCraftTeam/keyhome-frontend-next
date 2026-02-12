import api from '@/lib/api';
import { User, PaginatedResponse, Ad } from '@/types';

export const usersService = {
  async list(params?: { page?: number }): Promise<PaginatedResponse<User>> {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async show(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data.data ?? data;
  },

  async update(id: string, formData: FormData): Promise<User> {
    formData.append('_method', 'PUT');
    const { data } = await api.post(`/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.user ?? data.data ?? data;
  },
};

export const recommendationsService = {
  async list(): Promise<{ data: Ad[]; meta: { source: string } }> {
    const { data } = await api.get('/recommendations');
    return data;
  },
};

export const unlockedAdsService = {
  async list(): Promise<Ad[]> {
    const { data } = await api.get('/my/unlocked-ads');
    return data.data ?? data;
  },
};
