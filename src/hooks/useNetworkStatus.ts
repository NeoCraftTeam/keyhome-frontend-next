'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks browser online / offline status via the `navigator.onLine` API plus
 * the `online` / `offline` window events.
 *
 * SSR-safe — defaults to `true` on the server (no negative UX) and reconciles
 * to the real value once mounted on the client.
 *
 * Usage:
 * ```tsx
 * const isOnline = useNetworkStatus();
 * if (!isOnline) return <OfflineBanner />;
 * ```
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const sync = (): void => {
      setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    };

    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return isOnline;
}

export default useNetworkStatus;
