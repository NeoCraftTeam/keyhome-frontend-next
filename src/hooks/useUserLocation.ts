'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  const requestPosition = useCallback((forceRefresh = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Géolocalisation non supportée par votre navigateur.');
      setLoading(false);
      return;
    }

    // Don't re-ask if user previously denied (unless explicit refresh)
    if (!forceRefresh && wasDenied()) {
      setError('Vous avez refusé l\u2019accès à votre position.');
      setLoading(false);
      return;
    }

    const cached = !forceRefresh ? readCache() : null;
    if (cached) {
      setLocation(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setError(null);

    const handleSuccess = (pos: GeolocationPosition) => {
      const isApproximate = pos.coords.accuracy > ACCURACY_THRESHOLD_METERS;
      const loc: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        isApproximate,
      };
      setLocation(loc);
      setError(null);
      setLoading(false);
      writeCache(loc);
    };

    const handleError = (err: GeolocationPositionError) => {
      setLoading(false);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Vous avez refusé l\u2019accès à votre position.');
          writeDenied();
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Position indisponible.');
          break;
        case err.TIMEOUT:
          setError('Délai d\u2019attente dépassé.');
          break;
        default:
          setError('Impossible d\u2019obtenir votre position.');
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
  }, []);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    requestPosition();
  }, [requestPosition]);

  return {
    location,
    loading,
    error,
    refresh: () => requestPosition(true),
  };
}
