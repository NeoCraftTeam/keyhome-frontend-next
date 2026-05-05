'use client';

import { registerFcmToken, removeFcmToken } from '@/lib/chat-api';
import { FCM_TOKEN_STORAGE_KEY } from '@/lib/fcm-token-key';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useRef, useState } from 'react';
const WELCOME_DISMISSED_KEY = 'kh:welcome-dismissed';
const WELCOME_EVENT = 'kh:welcome-dismissed';

/** One warning per full page load (avoids duplicate logs under React Strict Mode). */
let fcmGetTokenDevFailureLogged = false;

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
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  useEffect(() => {
    registeredRef.current = false;
  }, [user?.id]);

  // Defer FCM permission prompt until the user has dismissed the welcome /
  // onboarding flow. Asking for system push permission too early (before the
  // user understands what KeyHome is) tanks the grant rate.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (localStorage.getItem(WELCOME_DISMISSED_KEY)) {
      setWelcomeDismissed(true);

      return;
    }

    const onDismissed = () => setWelcomeDismissed(true);
    window.addEventListener(WELCOME_EVENT, onDismissed);

    return () => {
      window.removeEventListener(WELCOME_EVENT, onDismissed);
    };
  }, []);

  useEffect(() => {
    if (!welcomeDismissed) return;
    if (!isAuthenticated || !user || registeredRef.current) return;
    if (typeof window === 'undefined') return;

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Without VAPID, FCM POSTs to fcmregistrations.googleapis.com return 401 — do not prompt or spam the API.
    if (!firebaseApiKey || !firebaseProjectId) return;

    const register = async (): Promise<void> => {
      try {
        // Guard: browser must support Notification + ServiceWorker APIs
        if (!('Notification' in window) || !('serviceWorker' in navigator))
          return;

        if (!firebaseVapidKey?.trim()) {
          if (process.env.NODE_ENV === 'development') {
            console.info(
              '[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing. Add the Web Push **public** key from Firebase Console → Project settings → Cloud Messaging → Web push certificates. Do not use NEXT_PUBLIC_VAPID_PUBLIC_KEY (Laravel web-push) here.'
            );
          }

          return;
        }

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
        const swReg =
          (await navigator.serviceWorker.getRegistration()) ??
          (await navigator.serviceWorker.ready);

        const token = await getToken(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          const legacy = sessionStorage.getItem(FCM_TOKEN_STORAGE_KEY);
          if (legacy && legacy !== token) {
            sessionStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
          }
          const cached = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
          if (cached !== token) {
            await registerFcmToken(token, 'web');
            localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
          }
          registeredRef.current = true;
        }
      } catch (err) {
        if (
          process.env.NODE_ENV === 'development' &&
          !fcmGetTokenDevFailureLogged
        ) {
          fcmGetTokenDevFailureLogged = true;
          const msg = err instanceof Error ? err.message : String(err);
          const credentialHint =
            /token-subscribe-failed|missing required authentication credential/i.test(
              msg
            )
              ? '\n→ Souvent : clé API Firebase (Google Cloud → Credentials) avec restrictions HTTP referrer / API qui bloquent `fcmregistrations.googleapis.com`. Ajoute `http://localhost:3000/*` et tes origines prod, ou « Aucune » restriction le temps de tester.'
              : '';
          console.warn(
            `[FCM] getToken / échec (push optionnel). Vérifier : (1) VAPID Web dans Firebase → Messagerie Cloud ; (2) toutes les NEXT_PUBLIC_FIREBASE_* du même projet Web ; (3) ne pas utiliser NEXT_PUBLIC_VAPID_PUBLIC_KEY (Laravel) à la place de la clé VAPID Firebase.${credentialHint}`,
            err
          );
        }
      }
    };

    register().catch(() => {
      /* push is optional */
    });
  }, [isAuthenticated, user, welcomeDismissed]);
}

/**
 * Remove the cached FCM token from the backend on logout.
 */
export async function removeFcmTokenOnLogout(): Promise<void> {
  const token =
    localStorage.getItem(FCM_TOKEN_STORAGE_KEY) ??
    sessionStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (token) {
    try {
      await removeFcmToken(token);
    } catch {
      // Best-effort
    }
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
  }
}
