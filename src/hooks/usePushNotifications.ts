'use client';

import api from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const PUSH_DISMISSED_KEY = 'kh_push_dismissed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isDismissed: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: 'unsupported',
    isSubscribed: false,
    isDismissed: false,
  });
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const dismissed = localStorage.getItem(PUSH_DISMISSED_KEY) === '1';

    if (!supported || !VAPID_PUBLIC_KEY) {
      setState((s) => ({ ...s, isSupported: false, isDismissed: dismissed }));
      return;
    }

    setState((s) => ({
      ...s,
      isSupported: true,
      permission: Notification.permission,
      isDismissed: dismissed,
    }));

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (registration) => {
        registrationRef.current = registration;
        const subscription = await registration.pushManager.getSubscription();
        setState((s) => ({ ...s, isSubscribed: !!subscription }));
      })
      .catch(() => {
        // SW registration failed — push won't work
      });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      setState((s) => ({ ...s, permission }));

      if (permission !== 'granted') return false;

      let registration = registrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        registrationRef.current = registration;
      }

      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      if (!p256dh || !auth) return false;

      await api.post('/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
      });

      setState((s) => ({ ...s, isSubscribed: true }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = registrationRef.current;
      if (!registration) return false;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return false;

      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      await subscription.unsubscribe();

      setState((s) => ({ ...s, isSubscribed: false }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(PUSH_DISMISSED_KEY, '1');
    setState((s) => ({ ...s, isDismissed: true }));
  }, []);

  return { ...state, subscribe, unsubscribe, dismiss };
}
