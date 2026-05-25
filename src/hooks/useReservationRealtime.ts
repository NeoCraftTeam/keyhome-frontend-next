'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/chat/echo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface ReservationStatusChangedPayload {
  reservation_id: string;
  status: string;
  status_label: string;
  previous_status: string;
  ad_id: string;
  slot_date: string;
  slot_starts_at: string;
  slot_ends_at: string;
}

/**
 * Subscribes to the private user channel to receive reservation status updates in real time.
 * On any status change, invalidates the reservations query cache so the UI refreshes automatically.
 *
 * Usage: call once in a layout or dashboard page component where the user is authenticated.
 *
 * @param userId - The authenticated user's UUID. Pass null/undefined to skip subscription.
 * @param onStatusChange - Optional callback fired with the broadcast payload for toasts/sounds.
 */
export function useReservationRealtime(
  userId: string | null | undefined,
  onStatusChange?: (payload: ReservationStatusChangedPayload) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !isReverbRealtimeConfigured()) return;

    let echo: ReturnType<typeof getEcho> | null = null;

    try {
      echo = getEcho();
    } catch {
      return;
    }

    const channel = echo.private(`user.${userId}`);

    channel.listen(
      '.reservation.status_changed',
      (data: ReservationStatusChangedPayload) => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({
          queryKey: ['reservation', data.reservation_id],
        });
        queryClient.invalidateQueries({ queryKey: ['slots', data.ad_id] });
        onStatusChange?.(data);
      }
    );

    return () => {
      try {
        echo?.leave(`private-user.${userId}`);
      } catch {
        // ignore cleanup errors
      }
    };
  }, [userId, queryClient, onStatusChange]);
}
