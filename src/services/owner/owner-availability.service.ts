/**
 * Owner availability service — Zap viewing schedule management.
 */
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

export const ownerAvailabilityService = {
  async getAvailabilities(adId: string, request?: { signal?: AbortSignal }) {
    const { data } = await api.get<{ data: AvailabilitySchedule[] }>(
      `/ads/${adId}/availability`,
      request?.signal ? { signal: request.signal } : {}
    );
    return data.data ?? data;
  },

  async createAvailability(adId: string, payload: AvailabilityPayload) {
    const { data } = await api.post(`/ads/${adId}/availability`, payload);
    return data;
  },

  async updateAvailability(
    adId: string,
    scheduleId: string,
    payload: Partial<AvailabilityPayload>
  ) {
    const { data } = await api.put(
      `/ads/${adId}/availability/${scheduleId}`,
      payload
    );
    return data;
  },

  async deleteAvailability(adId: string, scheduleId: string) {
    const { data } = await api.delete(
      `/ads/${adId}/availability/${scheduleId}`
    );
    return data;
  },

  async getAvailabilityCalendar(
    adId: string,
    from: string,
    to: string,
    request?: { signal?: AbortSignal }
  ) {
    const { data } = await api.get(`/ads/${adId}/availability/calendar`, {
      params: { from, to },
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data.data ?? data;
  },
};
