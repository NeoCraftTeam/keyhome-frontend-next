import api from '@/lib/api';

export interface SearchAlertPayload {
  label?: string;
  city_id?: string;
  city_name?: string;
  type_id?: string;
  type_name?: string;
  quarter_id?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  surface_min?: number;
  has_parking?: boolean;
  query?: string;
  is_active?: boolean;
}

export interface SearchAlert extends SearchAlertPayload {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const searchAlertsService = {
  list: (): Promise<{ data: SearchAlert[] }> =>
    api.get('/search-alerts').then((r) => r.data),

  create: (payload: SearchAlertPayload): Promise<{ data: SearchAlert }> =>
    api.post('/search-alerts', payload).then((r) => r.data),

  update: (id: string, payload: SearchAlertPayload): Promise<{ data: SearchAlert }> =>
    api.put(`/search-alerts/${id}`, payload).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/search-alerts/${id}`),
};
