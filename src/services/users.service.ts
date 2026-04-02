import api from '@/lib/api';
import { Ad, User, PaginatedResponse } from '@/types';

export interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  ad_title: string;
}

export interface PublicUserProfile {
  id: string;
  username: string | null;
  firstname: string;
  lastname: string;
  display_name: string;
  bio: string | null;
  avatar: string | null;
  type: 'individual' | 'agency' | null;
  city_name: string | null;
  is_verified: boolean;
  agency: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  member_since: string;
  total_active_ads: number;
  review_stats: {
    avg_rating: number;
    total_reviews: number;
  };
  response_time_label: string | null;
  recent_reviews: PublicReview[];
}

export interface PublicProfileResponse {
  success: boolean;
  data: PublicUserProfile;
  ads: Ad[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}

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

  /** JSON profile update (phone, city) — used after email OTP before dashboard. */
  async updateProfile(
    id: string,
    payload: { phone_number?: string; city_id?: string | null }
  ): Promise<User> {
    const { data } = await api.put<{ user: User; message?: string }>(
      `/users/${id}`,
      payload
    );
    return data.user ?? (data as unknown as User);
  },

  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const { data } = await api.get<PublicProfileResponse>(
      `/users/${userId}/public-profile`
    );
    return data;
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
