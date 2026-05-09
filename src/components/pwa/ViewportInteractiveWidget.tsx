'use client';

import { useEffect } from 'react';

/**
 * `interactive-widget=resizes-content` keeps the visual viewport in sync with the
 * on-screen keyboard on Chromium. Safari/WebKit log a console warning and ignore
 * the key if it appears in the initial viewport meta, so we omit it from
 * `export const viewport` and apply it here only for non-Safari browsers.
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
        ? `${content}, interactive-widget=resizes-content`
        : 'interactive-widget=resizes-content'
    );
  }, []);

  return null;
}
