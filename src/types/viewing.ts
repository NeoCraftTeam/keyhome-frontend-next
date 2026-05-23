import type { Ad } from './ad';
import type { User } from './user';

export enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Expired = 'expired',
  Completed = 'completed',
  NoShow = 'no_show',
}

export enum CancelledBy {
  Client = 'client',
  Landlord = 'landlord',
  System = 'system',
}

export interface BookableSlot {
  starts_at: string;
  ends_at: string;
  is_available: boolean;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  status_label: string;
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
  client_message: string | null;
  landlord_notes: string | null;
  cancelled_by: CancelledBy | null;
  cancellation_reason: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  ad?: Ad;
  client?: User;
  next_steps?: string;
}

export interface CreateReservationPayload {
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
  client_message?: string;
}

export interface SlotsResponse {
  date: string;
  slots: BookableSlot[];
}
