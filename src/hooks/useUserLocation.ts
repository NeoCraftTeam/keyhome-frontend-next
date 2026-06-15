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

export interface UseUserLocationOptions {
  /**
   * When true, the hook subscribes to `navigator.geolocation.watchPosition`
   * instead of a one-shot `getCurrentPosition` — the singleton continuously
   * receives position updates and re-notifies listeners on every coarse
   * change (the geolocation API throttles based on device sensors).
   *
   * The watcher is reference-counted across mounted components: it starts
   * the first time any caller passes `watch: true` and stops only when the
   * last such caller unmounts. Default `false` keeps the existing one-shot
   * behaviour intact for callers that don't opt in.
   */
  watch?: boolean;
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
/** Listeners that opted into continuous tracking. The watcher stays live
 *  while this set is non-empty and is cleared down when the last live
 *  caller unmounts. Keyed by the same update fn that's in `_listeners`. */
const _watchListeners = new Set<() => void>();
/** ID returned by `navigator.geolocation.watchPosition`; null when idle. */
let _watchId: number | null = null;

function _notifyAll() {
  _listeners.forEach((fn) => fn());
}

function _applyPosition(pos: GeolocationPosition): void {
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
}

function _applyError(err: GeolocationPositionError): void {
  _singleton.loading = false;
  switch (err.code) {
    case err.PERMISSION_DENIED:
      _singleton.error = 'Vous avez refusé l’accès à votre position.';
      writeDenied();
      break;
    case err.POSITION_UNAVAILABLE:
      _singleton.error = 'Position indisponible.';
      break;
    case err.TIMEOUT:
      _singleton.error = 'Délai d’attente dépassé.';
      break;
    default:
      _singleton.error = 'Impossible d’obtenir votre position.';
  }
  _notifyAll();
}

function _startWatchIfNeeded(): void {
  if (_watchId !== null) return; // already watching
  if (typeof window === 'undefined' || !navigator.geolocation) return;
  if (wasDenied()) return;

  _watchId = navigator.geolocation.watchPosition(_applyPosition, _applyError, {
    enableHighAccuracy: true,
    timeout: 15_000,
    // `maximumAge: 0` would force a fresh fix on every coalesced update;
    // 30 s reuses recent OS-level fixes when the user is stationary,
    // which is the dominant case even in "live tracking" mode.
    maximumAge: 30_000,
  });
}

function _stopWatchIfIdle(): void {
  if (_watchListeners.size === 0 && _watchId !== null) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
  }
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

  navigator.geolocation.getCurrentPosition(_applyPosition, _applyError, {
    enableHighAccuracy: true,
    timeout: 15_000,
    maximumAge: 60_000,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useUserLocation(
  options: UseUserLocationOptions = {}
): UseUserLocationReturn {
  const { watch = false } = options;
  const [, rerender] = useState(0);

  useEffect(() => {
    const update = () => rerender((n) => n + 1);
    _listeners.add(update);

    if (watch) {
      _watchListeners.add(update);
      _startWatchIfNeeded();
    } else if (!_singleton.settled) {
      _requestPositionOnce();
    }

    return () => {
      _listeners.delete(update);
      if (watch) {
        _watchListeners.delete(update);
        _stopWatchIfIdle();
      }
    };
  }, [watch]);

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
