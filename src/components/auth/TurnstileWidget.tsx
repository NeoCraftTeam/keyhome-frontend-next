'use client';

import Script from 'next/script';
import { useCallback, useEffect, useId, useRef } from 'react';

/**
 * Lightweight Cloudflare Turnstile widget — no external React wrapper, no
 * extra bundle. Renders the official Turnstile challenge inline and emits the
 * resulting token via `onToken`. The token must be sent to the backend (it
 * verifies it via `TurnstileService`).
 *
 * Behaviour:
 *  - When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is missing, the component renders
 *    nothing (development fallback — backend is also fail-open in that case).
 *  - The Cloudflare script is loaded once per page via `<Script>`.
 *  - The widget auto-resizes (`size="flexible"`) so it fits both narrow and
 *    wide login forms; uses managed mode for invisible / interactive choice.
 */

type CloudflareTurnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact' | 'flexible' | 'invisible';
      action?: string;
    }
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: CloudflareTurnstile;
  }
}

interface TurnstileWidgetProps {
  /** Called with the verification token whenever Cloudflare succeeds. */
  onToken: (token: string) => void;
  /** Called when the token expires or fails. The form should disable submit. */
  onExpire?: () => void;
  /** Required-action label sent to Cloudflare (login / register). */
  action?: string;
  /** Visual theme — defaults to `auto` (matches OS / app theme). */
  theme?: 'light' | 'dark' | 'auto';
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export default function TurnstileWidget({
  onToken,
  onExpire,
  action,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const id = useId();

  // Keep callback refs fresh without re-rendering the widget.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const tryRender = useCallback(() => {
    if (!SITE_KEY) return;
    const lib = window.turnstile;
    const container = containerRef.current;
    if (!lib || !container || widgetIdRef.current) return;

    widgetIdRef.current = lib.render(container, {
      sitekey: SITE_KEY,
      action,
      theme,
      size: 'flexible',
      callback: (token: string) => onTokenRef.current(token),
      'error-callback': () => onExpireRef.current?.(),
      'expired-callback': () => onExpireRef.current?.(),
      'timeout-callback': () => onExpireRef.current?.(),
    });
  }, [action, theme]);

  useEffect(() => {
    if (!SITE_KEY) return;
    // Script may already be loaded (other widget on a sibling page).
    if (window.turnstile) {
      tryRender();
    }
    return () => {
      const lib = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (lib && widgetId) {
        try {
          lib.remove(widgetId);
        } catch {
          /* ignore — Cloudflare API throws if container is gone */
        }
      }
      widgetIdRef.current = null;
    };
  }, [tryRender]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={tryRender}
      />
      <div
        id={`kh-turnstile-${id}`}
        ref={containerRef}
        aria-label="Vérification anti-robot Cloudflare Turnstile"
      />
    </>
  );
}
