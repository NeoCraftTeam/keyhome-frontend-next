'use client';

import { syncKhSafeAreaInsets } from '@/lib/safe-area-insets';
import { useLayoutEffect } from 'react';

/**
 * Keeps `--kh-safe-area-*` in sync after hydration (keyboard, rotation,
 * delayed WebKit inset updates). The inline head script in `layout.tsx` handles
 * the earliest frames.
 */
export function SafeAreaInsetBridge() {
  useLayoutEffect(() => {
    const run = () => {
      syncKhSafeAreaInsets();
    };

    run();
    const id0 = requestAnimationFrame(run);
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 200);
    const t3 = window.setTimeout(run, 500);

    window.addEventListener('resize', run);
    window.addEventListener('orientationchange', run);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', run);
    vv?.addEventListener('scroll', run);

    return () => {
      cancelAnimationFrame(id0);
      cancelAnimationFrame(id1);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener('resize', run);
      window.removeEventListener('orientationchange', run);
      vv?.removeEventListener('resize', run);
      vv?.removeEventListener('scroll', run);
    };
  }, []);

  return null;
}
