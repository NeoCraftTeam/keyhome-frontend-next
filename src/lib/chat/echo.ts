'use client';

import { getAuthToken } from '@/lib/auth/auth-token';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'reverb'>;
  }
}

let echo: Echo<'reverb'> | null = null;

let missingReverbClientEnvLogged = false;

/**
 * Laravel Echo/Reverb nécessite des variables **NEXT_PUBLIC_*** disponibles dans le bundle
 * frontend (pas seulement le .env Laravel). Utilisée pour désactiver proprement le temps
 * réel sur Vercel si elles ont été oubliées.
 */
export function isReverbRealtimeConfigured(): boolean {
  const key = (process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? '').trim();
  const host = (process.env.NEXT_PUBLIC_REVERB_HOST ?? '').trim();

  return key.length > 0 && host.length > 0;
}

/** Exposed for tests — Clerk session tokens are JWT-shaped; Sanctum PATs use `id|plaintext`. */
export function shouldUseBearerForBroadcastAuth(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const looksLikeJwt = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
    token
  );

  return !looksLikeJwt;
}

/**
 * Derive the backend root URL from NEXT_PUBLIC_API_URL.
 * Strips the /api/v1 path suffix so we can reach /broadcasting/auth
 * which is registered at root level by Laravel, not under /api/v1.
 *
 * Examples:
 *   https://keyhome.test/api/v1  → https://keyhome.test
 *   http://localhost:8000/api/v1 → http://localhost:8000
 */
function getBackendOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!apiUrl) return '';
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl.replace(/\/api\/v1\/?$/, '');
  }
}

/**
 * Returns a singleton Laravel Echo instance connected to Laravel Reverb.
 *
 * Auth: POST `/api/v1/broadcasting/auth` with `credentials: 'include'`.
 * Sends `Authorization: Bearer` only when a Sanctum personal access token is
 * available — never sends a Clerk JWT, which would make Sanctum reject the
 * request before the session cookie is evaluated. Without a bearer token,
 * first-party Sanctum **cookie** authentication still authorizes private channels.
 *
 * Call disconnectEcho() on logout to clean up the WebSocket connection.
 */
export function getEcho(): Echo<'reverb'> {
  if (echo !== null) {
    return echo;
  }

  if (!isReverbRealtimeConfigured()) {
    if (typeof window !== 'undefined' && !missingReverbClientEnvLogged) {
      missingReverbClientEnvLogged = true;
      console.warn(
        '[Echo] Reverb désactivé : définissez NEXT_PUBLIC_REVERB_APP_KEY et NEXT_PUBLIC_REVERB_HOST ' +
          'sur Vercel (valeurs alignées avec REVERB_APP_KEY et le hostname WebSocket du serveur Reverb — ex. https). ' +
          'Backend : docker compose avec service reverb, BROADCAST_CONNECTION=reverb.'
      );
    }
    throw new Error(
      'Reverb client not configured — supply NEXT_PUBLIC_REVERB_APP_KEY and NEXT_PUBLIC_REVERB_HOST for the frontend build.'
    );
  }

  if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
  }

  echo = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY!,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST!,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    // PusherJS v8: channelAuthorization replaces the deprecated authorizer option.
    // customHandler is called for every private/presence channel subscription.
    channelAuthorization: {
      endpoint: `${getBackendOrigin()}/api/v1/broadcasting/auth`,
      transport: 'ajax' as const,

      customHandler: async (
        { socketId, channelName }: { socketId: string; channelName: string },
        callback: (error: Error | null, data: unknown) => void
      ) => {
        try {
          const rawToken = await getAuthToken();
          /**
           * Clerk session JWT (3 segments) is not a Sanctum PAT; sending it as
           * Bearer breaks Broadcast::auth because Sanctum tries to resolve it
           * as a token. Rely on session cookies for that case (or no auth yet).
           * Sanctum PAT from password login uses "id|plaintext" with a pipe.
           */
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (shouldUseBearerForBroadcastAuth(rawToken)) {
            headers.Authorization = `Bearer ${rawToken!}`;
          }

          const res = await fetch(
            `${getBackendOrigin()}/api/v1/broadcasting/auth`,
            {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channelName,
              }),
            }
          );

          if (!res.ok) {
            callback(new Error(`Auth failed: ${res.status}`), null);
            return;
          }

          const data: unknown = await res.json();
          callback(null, data);
        } catch (err) {
          callback(err instanceof Error ? err : new Error('Auth error'), null);
        }
      },
    } as unknown as never,
  });

  if (process.env.NODE_ENV === 'development') {
    echo.connector.pusher.connection.bind('error', (err: unknown) => {
      // Pusher fires bare {} on certain protocol events — only log real errors
      const hasContent =
        err != null &&
        typeof err === 'object' &&
        Object.keys(err as Record<string, unknown>).length > 0;
      if (hasContent) {
        console.error('[Echo] WebSocket error', err);
      }
    });

    echo.connector.pusher.connection.bind('state_change', (states: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Echo] Connection state changed', states);
      }
    });
  }

  return echo;
}

/**
 * Returns the current Pusher socket ID **without** creating a new Echo instance.
 * Used by the Axios interceptor to attach X-Socket-Id headers so the backend's
 * `->toOthers()` can correctly exclude the sender from broadcasts.
 * Returns null if Echo has not been initialised yet.
 */
export function getEchoSocketId(): string | null {
  if (echo === null) return null;
  try {
    return echo.socketId() ?? null;
  } catch {
    return null;
  }
}

/**
 * Disconnect and destroy the Echo instance.
 * Call on logout to prevent stale WebSocket connections.
 */
export function disconnectEcho(): void {
  if (echo !== null) {
    echo.disconnect();
    echo = null;
  }
}

export type EchoConnectionState =
  | 'connected'
  | 'connecting'
  | 'unavailable'
  | 'disconnected';

/**
 * React hook that subscribes to Pusher connection state changes and returns
 * the current WebSocket connection state. Used to show a reconnecting banner.
 */
export function useEchoConnectionState(): EchoConnectionState {
  const [state, setState] = useState<EchoConnectionState>(() =>
    isReverbRealtimeConfigured() ? 'connecting' : 'disconnected'
  );

  useEffect(() => {
    if (!isReverbRealtimeConfigured()) {
      setState('disconnected');
      return;
    }

    const pusher = getEcho().connector.pusher;
    setState(pusher.connection.state as EchoConnectionState);

    const handler = ({ current }: { current: string }) => {
      setState(current as EchoConnectionState);
    };

    pusher.connection.bind('state_change', handler);
    return () => {
      pusher.connection.unbind('state_change', handler);
    };
  }, []);

  return state;
}
