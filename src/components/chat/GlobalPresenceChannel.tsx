'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/echo';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';

/**
 * Keeps the authenticated user permanently joined to the `online-users`
 * presence channel for the duration of their session.
 *
 * Without this, a user only appears "online" while viewing a chat window
 * (since usePresence joins the channel per-conversation). Mounting this
 * component in the layout ensures any authenticated user is always
 * visible as online to their conversation partners.
 *
 * Mount once in DashboardLayout and OwnerLayoutClient alongside FcmRegistrar.
 */
export function GlobalPresenceChannel() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isReverbRealtimeConfigured()) return;

    const echo = getEcho();
    echo.join('online-users');

    // Intentionally no cleanup: leaving the channel on every navigation (React
    // effect teardown) causes a brief member_removed → member_added cycle that
    // makes the user appear offline to their peers while pages are loading.
    // The channel stays alive for the whole session; echo.disconnect() on
    // logout cleanly tears down all subscriptions.
  }, [isAuthenticated]);

  return null;
}
