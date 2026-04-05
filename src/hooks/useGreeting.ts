'use client';

import { useAuth } from '@/providers/AuthProvider';
import { authService } from '@/services/auth.service';
import { useEffect, useRef, useState } from 'react';

const RETURN_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 heures

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/**
 * Returns a reactive greeting based on time of day and last visit (backend).
 * - Time-based: Bonjour (matin), Bon après-midi, Bonsoir
 * - "Bon retour parmi nous" when user hasn't visited home in 24h+ (from backend)
 */
export function useGreeting(): string {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting);
  const trackedRef = useRef(false);

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

    if (!trackedRef.current) {
      trackedRef.current = true;
      authService
        .trackHomeVisit()
        .then(() => refreshUser())
        .catch(() => {
          /* ignore */
        });
    }
  }, [isAuthenticated, user?.last_home_visit_at, refreshUser]);

  return greeting;
}
