'use client';

import { useCallback, useEffect, useState } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  isApproximate: boolean;
}

export interface UseUserLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  /** Re-request the user's position */
  refresh: () => void;
}

const ACCURACY_THRESHOLD_METERS = 5_000;
const STORAGE_KEY = 'user-location';
const DENIED_KEY = 'user-location-denied';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLocation {
  location: UserLocation;
  timestamp: number;
}

function readCache(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: CachedLocation = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.location;
  } catch {
    return null;
  }
}

function writeCache(location: UserLocation): void {
  try {
    const payload: CachedLocation = { location, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(DENIED_KEY);
  } catch {
    // storage unavailable
  }
}

function wasDenied(): boolean {
  try {
    return localStorage.getItem(DENIED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDenied(): void {
  try {
    localStorage.setItem(DENIED_KEY, '1');
  } catch {
    // storage unavailable
  }
}

// ─── Module-level singleton ────────────────────────────────────────────────
// Ensures exactly ONE navigator.geolocation.getCurrentPosition call is made
// regardless of how many components mount useUserLocation simultaneously.
// All instances share the result through a pub/sub listener set.

interface SingletonState {
  location: UserLocation | null;
  error: string | null;
  loading: boolean;
  /** Whether a getCurrentPosition call is already in flight or has resolved. */
  settled: boolean;
}

const _singleton: SingletonState = {
  location: null,
  error: null,
  loading: false,
  settled: false,
};

const _listeners = new Set<() => void>();

function _notifyAll() {
  _listeners.forEach((fn) => fn());
}

function _requestPositionOnce(forceRefresh = false): void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    _singleton.error = 'Géolocalisation non supportée par votre navigateur.';
    _singleton.loading = false;
    _singleton.settled = true;
    _notifyAll();
    return;
  }

  if (!forceRefresh && wasDenied()) {
    _singleton.error = 'Vous avez refusé l\u2019accès à votre position.';
    _singleton.loading = false;
    _singleton.settled = true;
    _notifyAll();
    return;
  }

  const cached = !forceRefresh ? readCache() : null;
  if (cached) {
    _singleton.location = cached;
    _singleton.error = null;
    _singleton.loading = false;
    _singleton.settled = true;
    _notifyAll();
    return;
  }

  if (_singleton.settled && !forceRefresh) return;

  _singleton.loading = true;
  _singleton.settled = true;
  _notifyAll();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const isApproximate = pos.coords.accuracy > ACCURACY_THRESHOLD_METERS;
      const loc: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        isApproximate,
      };
      _singleton.location = loc;
      _singleton.error = null;
      _singleton.loading = false;
      writeCache(loc);
      _notifyAll();
    },
    (err) => {
      _singleton.loading = false;
      switch (err.code) {
        case err.PERMISSION_DENIED:
          _singleton.error = 'Vous avez refusé l\u2019accès à votre position.';
          writeDenied();
          break;
        case err.POSITION_UNAVAILABLE:
          _singleton.error = 'Position indisponible.';
          break;
        case err.TIMEOUT:
          _singleton.error = 'Délai d\u2019attente dépassé.';
          break;
        default:
          _singleton.error = 'Impossible d\u2019obtenir votre position.';
      }
      _notifyAll();
    },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useUserLocation(): UseUserLocationReturn {
  const [, rerender] = useState(0);

  useEffect(() => {
    const update = () => rerender((n) => n + 1);
    _listeners.add(update);

    if (!_singleton.settled) {
      _requestPositionOnce();
    }

    return () => {
      _listeners.delete(update);
    };
  }, []);

  const refresh = useCallback(() => {
    _singleton.settled = false;
    _singleton.location = null;
    _singleton.error = null;
    _requestPositionOnce(true);
  }, []);

  return {
    location: _singleton.location,
    loading: _singleton.loading,
    error: _singleton.error,
    refresh,
  };
}
