'use client';

import { API_URL } from '@/lib/api';
import { useEffect, useState } from 'react';

type TurnstileConfigResponse = {
  success?: boolean;
  data?: { site_key?: string | null };
};

/**
 * Cloudflare documented dummy site key — always passes (visible widget).
 *
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const CLOUDFLARE_TURNSTILE_DUMMY_SITE_KEY = '1x00000000000000000000AA';

function envSiteKey(): string | null {
  const raw = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (typeof raw !== 'string') {
    return null;
  }
  const t = raw.trim();
  return t !== '' ? t : null;
}

function isLocalLikeHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.test')
  );
}

function isProductionTurnstileForcedOnLocalHost(): boolean {
  return process.env.NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_KEYS === 'true';
}

/**
 * Resolves Turnstile site key for the widget.
 *
 * On local-style hostnames we default to Cloudflare's **dummy** public key (and Laravel
 * `APP_ENV=local` uses the matching dummy secret), so real keys in `.env` / `NEXT_PUBLIC_*`
 * do not trigger error 110200 on localhost.
 *
 * Opt out: `TURNSTILE_USE_PRODUCTION_KEYS=true` (Laravel) +
 * `NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_KEYS=true` (Next) — add the host to Turnstile.
 */
export function useTurnstileSiteKey(): {
  siteKey: string | null;
  isResolved: boolean;
} {
  const buildTimeEnvKey = envSiteKey();

  const [useLocalDummyWidget, setUseLocalDummyWidget] = useState(false);
  const [localDevOverride, setLocalDevOverride] = useState<
    'pending' | 'prefer-remote' | 'use-build-env'
  >('pending');

  useEffect(() => {
    const h = window.location.hostname;
    const localLike = isLocalLikeHostname(h);
    const dummy = localLike && !isProductionTurnstileForcedOnLocalHost();

    if (dummy) {
      setUseLocalDummyWidget(true);
      setLocalDevOverride('use-build-env');
      return;
    }

    setUseLocalDummyWidget(false);

    if (!buildTimeEnvKey) {
      setLocalDevOverride('use-build-env');
      return;
    }

    setLocalDevOverride(localLike ? 'prefer-remote' : 'use-build-env');
  }, [buildTimeEnvKey]);

  const envKey =
    useLocalDummyWidget || localDevOverride === 'prefer-remote'
      ? null
      : buildTimeEnvKey;

  const [remoteKey, setRemoteKey] = useState<string | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useEffect(() => {
    if (useLocalDummyWidget) {
      return;
    }

    if (localDevOverride === 'pending') {
      return;
    }

    if (envKey) {
      setRemoteLoaded(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const base = API_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/config/turnstile`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit',
        });
        if (!res.ok) {
          throw new Error(`turnstile config HTTP ${res.status}`);
        }
        const json = (await res.json()) as TurnstileConfigResponse;
        const sk = json.data?.site_key;
        const trimmed =
          typeof sk === 'string' && sk.trim() !== '' ? sk.trim() : null;
        if (!cancelled) {
          setRemoteKey(trimmed);
        }
      } catch {
        if (!cancelled) {
          setRemoteKey(null);
        }
      } finally {
        if (!cancelled) {
          setRemoteLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [envKey, localDevOverride, useLocalDummyWidget]);

  const siteKey = useLocalDummyWidget
    ? CLOUDFLARE_TURNSTILE_DUMMY_SITE_KEY
    : (envKey ?? remoteKey);

  const isResolved =
    useLocalDummyWidget ||
    (localDevOverride !== 'pending' && (Boolean(envKey) || remoteLoaded));

  return { siteKey, isResolved };
}
