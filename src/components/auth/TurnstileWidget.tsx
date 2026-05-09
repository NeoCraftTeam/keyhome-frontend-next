'use client';

import Script from 'next/script';
import { useCallback, useEffect, useId, useRef } from 'react';

/**
 * Cloudflare Turnstile — explicit rendering for Next.js client components.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 *
 * - Official script URL only (`api.js?render=explicit`) — never proxy or cache this file.
 * - Do **not** call `turnstile.ready()` here: Next.js `<Script strategy="afterInteractive">`
 *   injects `defer`, and Cloudflare throws if `ready()` is used with async/defer.
 *   We call `turnstile.render()` only after `onLoad` or when `window.turnstile` already exists.
 * - `link rel="preconnect"` to `challenges.cloudflare.com` once (performance).
 */

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

let preconnectInserted = false;

function ensurePreconnectToChallenges(): void {
  if (typeof document === 'undefined' || preconnectInserted) {
    return;
  }
  preconnectInserted = true;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = TURNSTILE_ORIGIN;
  document.head.appendChild(link);
}

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible' | 'invisible';
  callback?: (token: string) => void;
  'error-callback'?: (errorCode?: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
};

type CloudflareTurnstile = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: CloudflareTurnstile;
  }
}

interface TurnstileWidgetProps {
  /** Public site key (same value as `TURNSTILE_SITE_KEY` / Turnstile dashboard). */
  siteKey: string;
  onToken: (token: string) => void;
  /** Called on error, expiry, or timeout (token no longer valid for submit). */
  onExpire?: () => void;
  /**
   * Cloudflare client error code (e.g. 110200 = domain not authorized).
   * @see https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
   */
  onErrorCode?: (code: string) => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export default function TurnstileWidget({
  siteKey,
  onToken,
  onExpire,
  onErrorCode,
  action,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorCodeRef = useRef(onErrorCode);
  /** `Script.onLoad` runs outside the effect — always invoke the latest mount logic. */
  const scheduleMountRef = useRef<() => void>(() => {});
  const id = useId();

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    onErrorCodeRef.current = onErrorCode;
  }, [onErrorCode]);

  useEffect(() => {
    ensurePreconnectToChallenges();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const lib = window.turnstile;
    const existingId = widgetIdRef.current;
    if (lib && existingId) {
      try {
        lib.remove(existingId);
      } catch {
        /* ignore */
      }
    }
    widgetIdRef.current = null;

    const container = containerRef.current;
    if (container) {
      container.replaceChildren();
    }

    const scheduleMount = (): void => {
      if (cancelled) {
        return;
      }

      const turnstile = window.turnstile;
      const el = containerRef.current;
      if (!turnstile || !el || widgetIdRef.current !== null) {
        return;
      }

      const runRender = (): void => {
        if (cancelled) {
          return;
        }
        const l = window.turnstile;
        const target = containerRef.current;
        if (!l || !target || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = l.render(target, {
          sitekey: siteKey,
          action,
          theme,
          size: 'flexible',
          callback: (token: string) => onTokenRef.current(token),
          'error-callback': (code?: string) => {
            onExpireRef.current?.();
            onErrorCodeRef.current?.(
              code !== undefined && code !== '' ? String(code) : 'unknown'
            );
            return true;
          },
          'expired-callback': () => onExpireRef.current?.(),
          'timeout-callback': () => onExpireRef.current?.(),
        });
      };

      runRender();
    };

    scheduleMountRef.current = scheduleMount;

    if (window.turnstile) {
      scheduleMount();
    }

    return () => {
      cancelled = true;
      const libCleanup = window.turnstile;
      const widgetId = widgetIdRef.current;
      if (libCleanup && widgetId) {
        try {
          libCleanup.remove(widgetId);
        } catch {
          /* ignore — Cloudflare API throws if container is gone */
        }
      }
      widgetIdRef.current = null;
    };
  }, [action, siteKey, theme]);

  const handleScriptLoad = useCallback(() => {
    scheduleMountRef.current();
  }, []);

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <div
        id={`kh-turnstile-${id}`}
        ref={containerRef}
        role="region"
        aria-label="Vérification anti-robot Cloudflare Turnstile"
      />
    </>
  );
}
