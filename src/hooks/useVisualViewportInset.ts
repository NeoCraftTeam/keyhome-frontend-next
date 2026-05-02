'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the bottom inset of the visual viewport vs the layout viewport.
 *
 * On iOS Safari (and to a lesser extent Android Chrome) the on-screen
 * keyboard does NOT push the document up — it only shrinks the visual
 * viewport. CSS like `position: fixed; bottom: 0` therefore disappears
 * BEHIND the keyboard. The `visualViewport` API exposes the actual
 * keyboard-aware viewport rectangle, so we can compute how much we need
 * to shift the message input up.
 *
 * Returns the number of CSS pixels the input should be lifted (0 when no
 * keyboard is visible, or when the API is unavailable).
 *
 * SSR-safe: always returns 0 on the server.
 */
export function useVisualViewportInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const layoutBottom = window.innerHeight;
      const visualBottom = vv.height + vv.offsetTop;
      const next = Math.max(0, Math.round(layoutBottom - visualBottom));
      setInset(next);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
