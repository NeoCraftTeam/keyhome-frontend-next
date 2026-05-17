/**
 * Helpers for Microsoft Clarity (`window.clarity`).
 *
 * Prefer identifying with the Laravel Sanctum user from `useAuth()` (backend
 * UUID + role). Clerk may coexist for OAuth/session exchange; the canonical
 * stable id remains `User.id` from the KeyHome API.
 */

import type { User } from '@/types';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/** Normalised env flag (aligned with {@link MicrosoftClarity}). */
export function getMicrosoftClarityProjectId(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID === 'string'
      ? process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID.trim()
      : '';
  return raw;
}

export function isMicrosoftClarityEnabled(): boolean {
  return getMicrosoftClarityProjectId().length > 0;
}

const FRIENDLY_NAME_MAX_CHARS = 120;

function truncateLabel(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return value.slice(0, maxChars);
}

/**
 * Human-readable label for Clarity recordings (friendly name slot).
 * Order: First + last name → display_name → legacy name → lightly masked email.
 */
export function buildClarityFriendlyLabel(user: User): string | undefined {
  const first = user.firstname?.trim() ?? '';
  const last = user.lastname?.trim() ?? '';
  const combined = [first, last].filter((p) => p.length > 0).join(' ');
  if (combined.length > 0) {
    return truncateLabel(combined, FRIENDLY_NAME_MAX_CHARS);
  }

  const display = user.display_name?.trim();
  if (display && display.length > 0) {
    return truncateLabel(display, FRIENDLY_NAME_MAX_CHARS);
  }

  const legacyName = user.name?.trim();
  if (legacyName && legacyName.length > 0) {
    return truncateLabel(legacyName, FRIENDLY_NAME_MAX_CHARS);
  }

  const email = user.email?.trim();
  if (email?.includes('@')) {
    const [local, domain = ''] = email.split('@');
    if (local.length > 0) {
      const prefix = local.slice(0, Math.min(2, local.length));
      const masked = `${prefix}***@${domain}`;
      return truncateLabel(masked, FRIENDLY_NAME_MAX_CHARS);
    }
  }

  return undefined;
}

export function clarityIdentify(
  customId: string,
  friendlyName?: string | null
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const clarity = window.clarity;
  if (typeof clarity !== 'function') {
    return false;
  }

  const trimmed = typeof friendlyName === 'string' ? friendlyName.trim() : '';
  if (trimmed !== '') {
    clarity('identify', customId, '', '', trimmed);
    return true;
  }

  clarity('identify', customId);
  return true;
}

export function claritySet(
  key: string,
  value: string | readonly string[]
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const clarity = window.clarity;
  if (typeof clarity !== 'function') {
    return false;
  }
  clarity('set', key, value);
  return true;
}

export function clarityEvent(name: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const clarity = window.clarity;
  if (typeof clarity !== 'function') {
    return false;
  }
  clarity('event', name);
  return true;
}

/**
 * Invokes `callback` once `window.clarity` is available (script may load after
 * hydration). Returns a disposer; safe to call from `useEffect` cleanup.
 */
export function subscribeMicrosoftClarityReady(
  callback: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 100;

  const tick = (): void => {
    if (cancelled) {
      return;
    }
    if (typeof window.clarity === 'function') {
      callback();
      return;
    }
    attempts += 1;
    if (attempts >= maxAttempts) {
      return;
    }
    window.setTimeout(tick, 50);
  };

  tick();

  return () => {
    cancelled = true;
  };
}
