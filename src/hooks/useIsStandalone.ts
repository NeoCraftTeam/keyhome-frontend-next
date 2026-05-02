'use client';

import { useSyncExternalStore } from 'react';

/**
 * True when the app runs as an installed / standalone WebView surface:
 * PWA added to home screen, fullscreen/minimal-ui, iOS navigator.standalone.
 *
 * Uses {@link useSyncExternalStore} so Safari / Chromium report the correct mode
 * on the first client paint (no deferred `useEffect`), avoiding UI flashes for
 * layout that depends on standalone (navbar, etc.).
 */
function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const minimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return standalone || fullscreen || minimalUi || iosStandalone;
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mq1 = window.matchMedia('(display-mode: standalone)');
  const mq2 = window.matchMedia('(display-mode: fullscreen)');
  const mq3 = window.matchMedia('(display-mode: minimal-ui)');

  mq1.addEventListener('change', onStoreChange);
  mq2.addEventListener('change', onStoreChange);
  mq3.addEventListener('change', onStoreChange);
  window.addEventListener('orientationchange', onStoreChange);

  return () => {
    mq1.removeEventListener('change', onStoreChange);
    mq2.removeEventListener('change', onStoreChange);
    mq3.removeEventListener('change', onStoreChange);
    window.removeEventListener('orientationchange', onStoreChange);
  };
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsStandalone(): boolean {
  return useSyncExternalStore(
    subscribe,
    getStandaloneSnapshot,
    getServerSnapshot
  );
}
