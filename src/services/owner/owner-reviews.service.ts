/**
 * Owner reviews service — received reviews + viewing reservations (owner side).
 */
import api from '@/lib/api';

export interface OwnerReview {
  id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  owner_response: string | null;
  owner_responded_at: string | null;
  created_at: string;
  ad?: { id: string; title: string };
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    display_name: string;
  };
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
  client?: {
    firstname: string;
    lastname: string;
    phone_number?: string;
    email?: string;
  };
  ad?: { id: string; title: string };
  created_at: string;
}

export const ownerReviewsService = {
  async getMyReviews(
    params?: { page?: number; per_page?: number },
    request?: { signal?: AbortSignal }
  ) {
    const { data } = await api.get('/my/reviews', {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
    return data;
  },

  async respondToReview(
    reviewId: string,
    response: string
  ): Promise<{ data: OwnerReview; message: string }> {
    const { data } = await api.post(`/reviews/${reviewId}/respond`, {
      response,
    });
    return data;
  },

  async getViewingReservations(
    params?: { page?: number; status?: string },
    request?: { signal?: AbortSignal }
  ) {
    const { data } = await api.get<{
      data: OwnerViewingReservation[];
      meta: { current_page: number; last_page: number; total: number };
    }>('/my/viewing-reservations', {
      params: params ?? {},
      ...(request?.signal ? { signal: request.signal } : {}),
    });
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

  async noShowReservation(reservationId: string) {
    const { data } = await api.post(`/reservations/${reservationId}/no-show`);
    return data;
  },

  async getLandlordCalendarUrl(): Promise<string> {
    const { data } = await api.get('/my/landlord-calendar-url');
    return (data as { url: string }).url;
  },
};
