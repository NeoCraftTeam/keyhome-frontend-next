'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js and handles the full update lifecycle:
 *  - updateViaCache: 'none' so the browser never serves a stale sw.js
 *  - 60-minute periodic update check
 *  - broadcasts 'sw-updated' when a new SW is waiting (caught by PWAInstallPrompt)
 *  - listens for controllerchange to reload once the new SW takes over
 *
 * Renders nothing — exists purely for side-effects.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator))
      return;
    // En dev, le SW n’est pas enregistré sauf NEXT_PUBLIC_ENABLE_SW=1 (test PWA / push en local).
    if (
      process.env.NODE_ENV !== 'production' &&
      !process.env.NEXT_PUBLIC_ENABLE_SW
    ) {
      return;
    }

    let refreshing = false;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          // Never serve sw.js from the browser HTTP cache — always re-fetch
          updateViaCache: 'none',
        });

        // Detect when a newly installed SW is waiting to activate
        const trackInstalling = (worker: ServiceWorker) => {
          worker.addEventListener('statechange', () => {
            // 'installed' + existing controller  → update is ready
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent('sw-updated'));
            }
          });
        };

        // Handle SW found during this registration
        registration.addEventListener('updatefound', () => {
          if (registration.installing) trackInstalling(registration.installing);
        });

        // Also track any SW that was already installing when we registered
        if (registration.installing) trackInstalling(registration.installing);

        // When the SW signals it has taken control, reload once
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // Periodic update check every 60 min
        setInterval(() => registration.update(), 60 * 60 * 1000);
      } catch (err) {
        console.warn('[PWA] Service worker registration failed:', err);
      }
    };

    // Defer until the page is fully loaded to avoid competing with LCP
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }
  }, []);

  return null;
}
