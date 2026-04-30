'use client';

import { getEcho } from '@/lib/echo';
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

    const echo = getEcho();
    echo.join('online-users');

    return () => {
      echo.leave('online-users');
    };
  }, [isAuthenticated]);

  return null;
}
