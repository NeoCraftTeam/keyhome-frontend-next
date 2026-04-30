'use client';

import { registerFcmToken, removeFcmToken } from '@/lib/chat-api';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useRef } from 'react';

const FCM_TOKEN_KEY = 'kh_fcm_token';

/**
 * Registers a Firebase FCM token for the authenticated user.
 *
 * - Requests notification permission on mount (if not already granted/denied).
 * - Registers the token with the backend via POST /api/v1/fcm/token.
 * - Removes the token on logout (call removeFcmTokenOnLogout).
 *
 * IMPORTANT — single service worker design:
 * FCM is bound to the same `/sw.js` registered by `ServiceWorkerRegistrar`. The
 * generic `push` event handler in `public/sw.js` already extracts FCM-shaped
 * payloads (title/body inside `notification`, deep-link inside `data.url`),
 * so we do NOT register a separate `firebase-messaging-sw.js`. Two SWs at the
 * same scope race for activation and the loser silently drops push events on
 * standalone PWA installs — this caused new chat messages to never appear in
 * the system tray.
 *
 * Requires NEXT_PUBLIC_FIREBASE_* env vars.
 */
export function useFcmToken(): void {
  const { user, isAuthenticated } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || registeredRef.current) return;
    if (typeof window === 'undefined') return;

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) return; // Firebase not configured

    const register = async (): Promise<void> => {
      try {
        // Guard: browser must support Notification + ServiceWorker APIs
        if (!('Notification' in window) || !('serviceWorker' in navigator))
          return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Dynamic import to avoid SSR issues
        const { initializeApp, getApps } = await import('firebase/app');
        const { getMessaging, getToken, isSupported } =
          await import('firebase/messaging');

        // Guard: Firebase Messaging requires specific browser APIs
        if (!(await isSupported())) return;

        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app =
          getApps().length === 0
            ? initializeApp(firebaseConfig)
            : getApps()[0]!;

        const messaging = getMessaging(app);

        // Reuse the main /sw.js registration (already registered by
        // ServiceWorkerRegistrar). FCM delivers messages via the standard
        // Web Push API; sw.js's `push` event handler extracts the payload.
        const swReg = await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          const cached = sessionStorage.getItem(FCM_TOKEN_KEY);
          if (cached !== token) {
            await registerFcmToken(token, 'web');
            sessionStorage.setItem(FCM_TOKEN_KEY, token);
          }
          registeredRef.current = true;
        }
      } catch {
        // Silently fail — push notifications are optional
      }
    };

    register().catch(() => {
      /* push is optional */
    });
  }, [isAuthenticated, user]);
}

/**
 * Remove the cached FCM token from the backend on logout.
 */
export async function removeFcmTokenOnLogout(): Promise<void> {
  const token = sessionStorage.getItem(FCM_TOKEN_KEY);
  if (token) {
    try {
      await removeFcmToken(token);
    } catch {
      // Best-effort
    }
    sessionStorage.removeItem(FCM_TOKEN_KEY);
  }
}
