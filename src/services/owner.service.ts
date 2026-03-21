import api from '@/lib/api';

export interface AvailabilityPeriod {
  id?: string;
  starts_at: string;
  ends_at: string;
}

export interface AvailabilitySchedule {
  id: string;
  name: string;
  type: string;
  is_recurring: boolean;
  frequency: string | null;
  frequency_config: Record<string, unknown> | null;
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
  slot_duration: number;
  buffer_minutes: number;
  periods: AvailabilityPeriod[];
  created_at: string;
  updated_at: string;
}

export interface AvailabilityPayload {
  name: string;
  starts_on: string;
  ends_on?: string | null;
  periods: { starts_at: string; ends_at: string }[];
  recurrence?: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_days?: string[];
  days_of_month?: number[];
  slot_duration?: number;
  buffer_minutes?: number;
}

export interface OwnerAnalyticsOverview {
  period: string;
  totals: {
    impressions: number;
    views: number;
    favorites: number;
    shares: number;
    contact_clicks: number;
    phone_clicks: number;
    unlocks: number;
    conversion_rate: number;
    engagement_rate: number;
  };
  /** Clés = types d’interaction API (`view`, `favorite`, …), points = { date, count } */
  trends: Record<string, { date: string; count: number }[]>;
  top_ads: Array<{
    ad_id: string;
    title: string;
    status?: string;
    views: number;
    favorites: number;
    unlocks: number;
    conversion_rate?: number;
  }>;
}

export interface LeaseContract {
  id: string;
  contract_number: string;
  unit_reference: string | null;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string | null;
  tenant_id_number: string | null;
  lease_start: string;
  lease_end: string;
  lease_duration_months: number;
  monthly_rent: number;
  deposit_amount: number | null;
  special_conditions: string | null;
  created_at: string;
  ad?: { id: string; title: string };
}

export interface OwnerReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  ad?: { id: string; title: string };
  user?: { id: string; firstname: string; lastname: string; display_name: string };
}

export interface OwnerViewingReservation {
  id: string;
  status: string;
  status_label: string;
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
  client_message: string | null;
  landlord_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  expires_at: string | null;
  client?: { firstname: string; lastname: string; phone_number?: string; email?: string };
  ad?: { id: string; title: string };
  created_at: string;
}

export const ownerService = {
  async getAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<OwnerAnalyticsOverview> {
    const { data } = await api.get<{ data: OwnerAnalyticsOverview }>('/my/ads/analytics', {
      params: { period },
    });
    return data.data ?? data;
  },

  async getMyAds(params?: {
    page?: number;
    per_page?: number;
    q?: string;
    status?: string;
    type_id?: string;
    city_id?: string;
    quarter_id?: string;
    price_min?: number;
    price_max?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const { data } = await api.get('/my/ads', { params });
    return data;
  },

  async getLeaseContracts(params?: { page?: number; per_page?: number }) {
    const { data } = await api.get<{
      data: LeaseContract[];
      meta: { current_page: number; last_page: number; total: number; per_page: number };
    }>('/my/lease-contracts', { params });
    return data;
  },

  async enhanceLeaseConditions(conditions: string): Promise<string> {
    const { data } = await api.post<{ enhanced: string }>('/my/lease-contracts/ai/enhance-conditions', {
      conditions,
    });
    return data.enhanced;
  },

  async getLeaseContract(id: string): Promise<LeaseContract> {
    const { data } = await api.get<{ data: LeaseContract }>(`/my/lease-contracts/${id}`);
    return data.data ?? data;
  },

  async updateLeaseContract(
    id: string,
    updates: {
      tenant_name?: string;
      tenant_phone?: string;
      tenant_email?: string | null;
      tenant_id_number?: string | null;
      unit_reference?: string | null;
      special_conditions?: string | null;
    },
  ): Promise<LeaseContract> {
    const { data } = await api.put<{ data: LeaseContract }>(`/my/lease-contracts/${id}`, updates);
    return data.data ?? data;
  },

  async downloadLeaseContract(id: string): Promise<Blob> {
    const { data } = await api.get(`/my/lease-contracts/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async generateLeaseContract(
    adId: string,
    tenantData: {
      tenant_name: string;
      tenant_phone: string;
      tenant_email?: string;
      tenant_id_number?: string;
      unit_reference?: string;
      lease_start: string;
      lease_duration_months: number;
      monthly_rent?: number;
      deposit_amount?: number;
      special_conditions?: string;
    },
  ) {
    const { data } = await api.post(`/my/lease-contracts/${adId}/generate`, tenantData);
    return data;
  },

  async getMyReviews(params?: { page?: number; per_page?: number }) {
    const { data } = await api.get('/my/reviews', { params });
    return data;
  },

  async getViewingReservations(params?: { page?: number; status?: string }) {
    const { data } = await api.get<{
      data: OwnerViewingReservation[];
      meta: { current_page: number; last_page: number; total: number };
    }>('/my/viewing-reservations', { params });
    return data;
  },

  async confirmReservation(reservationId: string) {
    const { data } = await api.post(`/reservations/${reservationId}/confirm`);
    return data;
  },

  async cancelReservation(reservationId: string, cancellationReason?: string) {
    const { data } = await api.delete(`/reservations/${reservationId}`, {
      data: { cancellation_reason: cancellationReason },
    });
    return data;
  },

  async updateReservationNotes(reservationId: string, landlordNotes: string) {
    const { data } = await api.patch(`/reservations/${reservationId}/notes`, {
      landlord_notes: landlordNotes,
    });
    return data;
  },

  /**
   * Initiate a boost purchase for an ad.
   */
  async boostAd(adId: string, planId: string, callbackUrl?: string) {
    const { data } = await api.post(`/my/ads/${adId}/boost`, {
      plan_id: planId,
      callback_url: callbackUrl,
    });
    return data;
  },

  /**
   * Initiate identity verification for the owner.
   */
  async verifyIdentity(formData: FormData) {
    const { data } = await api.post('/my/verify-identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Get available boost plans for owners.
   */
  async getBoostPlans() {
    const { data } = await api.get('/my/boost-plans');
    return data;
  },

  // ─── Viewing Availability (Zap) ───

  async getAvailabilities(adId: string) {
    const { data } = await api.get<{ data: AvailabilitySchedule[] }>(`/ads/${adId}/availability`);
    return data.data ?? data;
  },

  async createAvailability(adId: string, payload: AvailabilityPayload) {
    const { data } = await api.post(`/ads/${adId}/availability`, payload);
    return data;
  },

  async updateAvailability(adId: string, scheduleId: string, payload: Partial<AvailabilityPayload>) {
    const { data } = await api.put(`/ads/${adId}/availability/${scheduleId}`, payload);
    return data;
  },

  async deleteAvailability(adId: string, scheduleId: string) {
    const { data } = await api.delete(`/ads/${adId}/availability/${scheduleId}`);
    return data;
  },

  async getAvailabilityCalendar(adId: string, from: string, to: string) {
    const { data } = await api.get(`/ads/${adId}/availability/calendar`, { params: { from, to } });
    return data.data ?? data;
  },
};
