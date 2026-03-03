'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount and handles updates.
 * This component renders nothing — it exists purely for side effects.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Only register in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_SW) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates every 60 minutes
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // When a new SW is waiting, prompt user to refresh
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              // New version available — broadcast to the app
              window.dispatchEvent(new CustomEvent('sw-updated'));
            }
          });
        });
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err);
      }
    };

    // Defer registration until after hydration & initial paint
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }
  }, []);

  return null;
}
