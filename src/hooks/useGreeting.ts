'use client';

import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const RETURN_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 heures

/** sessionStorage key — cleared on logout (wipeBrowserStoragesForLogout calls sessionStorage.clear()). */
const HOME_TRACKED_KEY = 'kh_home_tracked';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  if (hour >= 18 && hour < 21) return 'Bonsoir';
  return 'Il se fait tard';
}

/**
 * Returns a reactive greeting based on time of day and last visit (backend).
 * - Time-based: Bonjour (matin), Bon après-midi, Bonsoir
 * - "Bon retour parmi nous" when user hasn't visited home in 24h+ (from backend)
 */
export function useGreeting(): string {
  const { user, isAuthenticated, setUser } = useAuth();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting);
  const userRef = useRef(user);

  // Keep ref in sync via useLayoutEffect so the async .then() callback always
  // has the latest user without adding `user` to the effect dependency array.
  useLayoutEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setGreeting(getTimeBasedGreeting());
      return;
    }

    const lastVisit = user.last_home_visit_at
      ? new Date(user.last_home_visit_at).getTime()
      : 0;
    const now = Date.now();
    const isReturning = lastVisit > 0 && now - lastVisit > RETURN_THRESHOLD_MS;

    setGreeting(isReturning ? 'Bon retour parmi nous' : getTimeBasedGreeting());

    // Use sessionStorage instead of useRef so the flag survives React Strict
    // Mode's double-mount and component remounts within the same browser tab.
    if (
      typeof window !== 'undefined' &&
      !sessionStorage.getItem(HOME_TRACKED_KEY)
    ) {
      sessionStorage.setItem(HOME_TRACKED_KEY, '1');
      authService
        .trackHomeVisit()
        .then(({ last_home_visit_at }) => {
          // Update the user locally — avoids a redundant GET /me round-trip.
          const current = userRef.current;
          if (current) setUser({ ...current, last_home_visit_at });
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, [isAuthenticated, user, setUser]);

  return greeting;
}
