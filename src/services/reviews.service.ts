import api from '@/lib/api';

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
  ad_id: string;
}

export const reviewsService = {
  async create(payload: CreateReviewPayload) {
    const { data } = await api.post('/reviews', payload);
    return data;
  },
};
