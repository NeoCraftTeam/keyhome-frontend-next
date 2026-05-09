'use client';

import { useEffect } from 'react';

/**
 * Client-side viewport hardening for the PWA shell:
 *
 * 1. **Keyboard sync (Chromium only)** — adds `interactive-widget=resizes-content`
 *    so the visual viewport tracks the on-screen keyboard. Safari/WebKit log a
 *    console warning and ignore the key when present in the initial viewport
 *    meta, so we apply it here for non-Safari browsers only.
 *
 * 2. **PWA-only zoom lock** — pinch-zoom is disabled exclusively when the app
 *    runs in `display-mode: standalone` (installed PWA). In a regular browser
 *    tab we keep `maximum-scale=5, user-scalable=yes` so users with low
 *    vision can still zoom (WCAG 1.4.4). Inside the installed PWA, the OS
 *    text-scaling settings remain the canonical accessibility lever, mirroring
 *    native iOS/Android apps.
 */
export default function ViewportInteractiveWidget(): null {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="viewport"]'
    );
    if (!meta) return;

    const ua = navigator.userAgent;
    const isSafariFamily =
      /Safari/i.test(ua) &&
      !/(Chrome|Chromium|Edg|OPR|CriOS|FxiOS|EdgiOS)/i.test(ua);

    const isStandalone = (): boolean =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    /** Build the canonical viewport string for the current display mode. */
    const buildViewport = (): string => {
      const base = [
        'width=device-width',
        'initial-scale=1',
        'viewport-fit=cover',
      ];
      if (isStandalone()) {
        base.push('maximum-scale=1', 'user-scalable=no');
      } else {
        // Browser tab → allow zoom up to 500% (WCAG 1.4.4).
        base.push('maximum-scale=5', 'user-scalable=yes');
      }
      if (!isSafariFamily) {
        base.push('interactive-widget=resizes-content');
      }
      return base.join(', ');
    };

    const apply = (): void => {
      meta.setAttribute('content', buildViewport());
    };

    apply();

    // React to display-mode changes (rare, but happens when a user installs
    // the app from the current tab — Chrome reuses the same document).
    const dm = window.matchMedia('(display-mode: standalone)');
    const onChange = (): void => apply();
    dm.addEventListener?.('change', onChange);

    return () => {
      dm.removeEventListener?.('change', onChange);
    };
  }, []);

  return null;
}
