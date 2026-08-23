'use client';

import { useEffect, useState } from 'react';

export interface VisualViewportRect {
  /** Height of the visible band above the keyboard, in CSS pixels. */
  height: number;
  /** Offset of the visual viewport from the layout viewport top (0 unless iOS scrolled under the keyboard). */
  offsetTop: number;
}

/**
 * Keyboard-aware rectangle of the visual viewport.
 *
 * On iOS Safari a `position: fixed` layer anchors to the *layout* viewport,
 * which the on-screen keyboard does NOT shrink. A full-height fixed chat pane
 * therefore keeps its size and the keyboard shoves its bottom (the composer)
 * off-screen while iOS scrolls the focused input into view — the "zoom"/jump
 * the chat used to exhibit. Sizing that pane to `window.visualViewport`
 * instead makes it cover exactly the band above the keyboard: header pinned at
 * the top, composer at the bottom, messages scrolling between.
 *
 * SSR-safe: returns `null` on the server and before the first client effect.
 * When `enabled` is false the hook attaches no listeners and returns `null`,
 * so routes that don't need it never re-render on scroll/resize.
 */
export function useVisualViewport(
  enabled: boolean = true
): VisualViewportRect | null {
  const [rect, setRect] = useState<VisualViewportRect | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setRect(null);
      return;
    }
    const vv = window.visualViewport;
    if (!vv) {
      setRect(null);
      return;
    }

    const update = (): void => {
      // Keep referential stability when nothing actually moved so the layout
      // doesn't re-render on redundant scroll events.
      setRect((prev) =>
        prev != null &&
        prev.height === vv.height &&
        prev.offsetTop === vv.offsetTop
          ? prev
          : { height: vv.height, offsetTop: vv.offsetTop }
      );
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return rect;
}
