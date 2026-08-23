'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js and handles the full update lifecycle:
 *  - updateViaCache: 'none' so the browser never serves a stale sw.js
 *  - 60-minute periodic update check
 *  - broadcasts 'sw-updated' when a new SW is waiting (caught by PWAInstallPrompt)
 *  - listens for controllerchange to reload once the new SW takes over
 *
 * Renders nothing — exists purely for side-effects. Although it is a root
 * app-lifetime singleton, the effect still tears down its `load` listener, the
 * `controllerchange` listener on the SW container, the `updatefound` listener
 * on the registration, and the periodic update `setInterval` on unmount — so a
 * remount (e.g. React StrictMode's double-invoke in dev) never leaves a
 * duplicate interval or listener behind.
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
    let updateIntervalId: ReturnType<typeof setInterval> | undefined;
    let activeRegistration: ServiceWorkerRegistration | undefined;

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
    const onUpdateFound = () => {
      const installing = activeRegistration?.installing;
      if (installing) trackInstalling(installing);
    };

    // When the SW signals it has taken control, reload once
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          // Never serve sw.js from the browser HTTP cache — always re-fetch
          updateViaCache: 'none',
        });
        activeRegistration = registration;

        registration.addEventListener('updatefound', onUpdateFound);

        // Also track any SW that was already installing when we registered
        if (registration.installing) trackInstalling(registration.installing);

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          onControllerChange
        );

        // Periodic update check every 60 min
        updateIntervalId = setInterval(
          () => registration.update(),
          60 * 60 * 1000
        );
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

    return () => {
      window.removeEventListener('load', registerSW);
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
      activeRegistration?.removeEventListener('updatefound', onUpdateFound);
      if (updateIntervalId !== undefined) {
        clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
}
