import api from '@/lib/api';
import type {
  BookableSlot,
  CreateReservationPayload,
  Reservation,
} from '@/types';

export const viewingsService = {
  /**
   * List available/unavailable slots for an ad on a specific date.
   * GET /api/v1/ads/{adId}/slots?date=YYYY-MM-DD
   */
  async getSlots(adId: string, date: string): Promise<BookableSlot[]> {
    const { data } = await api.get(`/ads/${adId}/slots`, { params: { date } });
    // Backend response: { data: { slots_by_date: { "YYYY-MM-DD": [...] } } }
    return data.data?.slots_by_date?.[date] ?? [];
  },

  /**
   * Fetch slots for a date range — used to mark calendar dates with availability.
   * GET /api/v1/ads/{adId}/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Returns { "YYYY-MM-DD": BookableSlot[] }
   */
  async getSlotsByRange(
    adId: string,
    from: string,
    to: string
  ): Promise<Record<string, BookableSlot[]>> {
    const { data } = await api.get(`/ads/${adId}/slots`, {
      params: { from, to },
    });
    return data.data?.slots_by_date ?? {};
  },

  /**
   * Create a tentative reservation for a slot.
   * POST /api/v1/ads/{adId}/reservations
   */
  async reserve(
    adId: string,
    payload: CreateReservationPayload
  ): Promise<Reservation> {
    const { data } = await api.post(`/ads/${adId}/reservations`, payload);
    return data.data ?? data;
  },

  /**
   * List the authenticated user's reservations, optionally filtered by ad.
   * GET /api/v1/my/reservations?ad_id={adId}
   */
  async myReservations(adId?: string, status?: string): Promise<Reservation[]> {
    const params: Record<string, string> = {};
    if (adId) {
      params.ad_id = adId;
    }
    if (status) {
      params.status = status;
    }
    const { data } = await api.get('/my/reservations', { params });
    return data.data ?? data;
  },

  /**
   * Cancel a reservation.
   * DELETE /api/v1/reservations/{reservationId}
   */
  async cancel(
    _adId: string,
    reservationId: string,
    reason?: string
  ): Promise<Reservation> {
    const { data } = await api.delete(`/reservations/${reservationId}`, {
      data: reason ? { cancellation_reason: reason } : undefined,
    });
    return data.data ?? data;
  },
};
