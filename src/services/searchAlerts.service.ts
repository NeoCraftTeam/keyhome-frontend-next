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
  /** Receives {@link SearchAlertMatchMail} when a listing matches (also respects global e-mail prefs). */
  notify_email?: boolean;
  /** Web Push + FCM mobile when token registered. */
  notify_push?: boolean;
  /** How often to receive notifications: immediate (each match), daily digest, weekly digest. */
  frequency?: 'immediate' | 'daily' | 'weekly';
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

  update: (
    id: string,
    payload: SearchAlertPayload
  ): Promise<{ data: SearchAlert }> =>
    api.put(`/search-alerts/${id}`, payload).then((r) => r.data),

  remove: (id: string): Promise<void> => api.delete(`/search-alerts/${id}`),

  previewCount: (
    criteria: Pick<
      SearchAlertPayload,
      | 'city_id'
      | 'city_name'
      | 'type_id'
      | 'quarter_id'
      | 'price_min'
      | 'price_max'
      | 'bedrooms_min'
      | 'surface_min'
      | 'has_parking'
    >
  ): Promise<{ count: number }> =>
    api.post('/search-alerts/preview-count', criteria).then((r) => r.data),
};
