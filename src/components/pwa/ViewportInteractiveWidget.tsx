'use client';

import { useEffect } from 'react';

/**
 * `interactive-widget=resizes-visual` keeps the layout viewport stable when the
 * on-screen keyboard opens (Chromium 108+). The page does NOT resize — only the
 * visual viewport shrinks — so the navbar/bottom-nav stay fixed like a native
 * messenger (WhatsApp/Messenger). The chat input is lifted via
 * `useVisualViewportInset()` + `translateY` instead of a layout resize.
 * Safari/WebKit would warn on an unknown viewport key, so we apply it only
 * on non-Safari browsers; iOS already handles this via `interactive-widget`
 * + visualViewport API.
 * See plan iridescent-exploring-metcalfe — B.1 viewport & hauteur stable.
 */
export default function ViewportInteractiveWidget(): null {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isSafariFamily =
      /Safari/i.test(ua) &&
      !/(Chrome|Chromium|Edg|OPR|CriOS|FxiOS|EdgiOS)/i.test(ua);

    if (isSafariFamily) {
      return;
    }

    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      return;
    }

    const content = meta.getAttribute('content') ?? '';
    if (content.includes('interactive-widget')) {
      return;
    }

    meta.setAttribute(
      'content',
      content.includes(',') || content.length > 0
        ? `${content}, interactive-widget=resizes-visual`
        : 'interactive-widget=resizes-visual'
    );
  }, []);

  return null;
}
