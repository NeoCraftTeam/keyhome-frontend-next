'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the app runs as a PWA (standalone/fullscreen):
 * - Added to home screen on mobile
 * - Installed from browser
 * - Downloaded from stores (TWA/Capacitor)
 *
 * Returns false when opened in a regular browser tab.
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = (): boolean => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const minimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
      const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

      return standalone || fullscreen || minimalUi || iosStandalone;
    };

    setIsStandalone(check());

    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = () => setIsStandalone(check());
    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);

  return isStandalone;
}
