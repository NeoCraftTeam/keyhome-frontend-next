'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { authService } from '@/services/auth.service';
import { UserRole } from '@/types';

/* ── In-memory token store ───────────────────────────────────────────
 * Never persisted to localStorage (XSS-safe).
 * The httpOnly session cookie (withCredentials: true) is the primary auth
 * mechanism. This in-memory token is the Bearer fallback for cross-origin
 * SPA→API scenarios.
 * ─────────────────────────────────────────────────────────────────── */

let inMemoryToken: string | null = null;

/** @internal — Reset module state between tests. Not for production use. */
export function __resetModuleStateForTests(): void {
  inMemoryToken = null;
}

export function getInMemoryToken(): string | null {
  return inMemoryToken;
}

export function hasAnySanctumInMemory(): boolean {
  return inMemoryToken !== null;
}

/* ── Session persistence ─────────────────────────────────────────── */

/** Store a Sanctum token in-memory only (never localStorage). */
export function persistInMemoryToken(sanctumToken: string): void {
  inMemoryToken = sanctumToken;
  registerTokenGetter(() => Promise.resolve(sanctumToken));
}

export function clearInMemoryToken(): void {
  inMemoryToken = null;
  registerTokenGetter(() => Promise.resolve(null));
}

export function registerInMemoryGetter(): void {
  registerTokenGetter(async () => inMemoryToken);
}

/* ── Role cookie management ──────────────────────────────────────── */

const ROLE_COOKIE = 'kh_role';
const ROLE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function setRoleCookie(role: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const isOwner = role === UserRole.AGENT || role === UserRole.ADMIN;

  // Enterprise Grade: Strict path scoping for role cookies
  // This ensures the browser only sends the 'agent' role cookie to /owner routes
  // and the 'customer' role cookie to other routes, preventing state bleed.
  if (isOwner) {
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/owner; SameSite=Lax; Max-Age=${ROLE_COOKIE_MAX_AGE}`;
    // Also clear any customer role cookie that might exist at root to avoid ambiguity
    document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  } else {
    document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax; Max-Age=${ROLE_COOKIE_MAX_AGE}`;
    // Clear any owner role cookie
    document.cookie = `${ROLE_COOKIE}=; path=/owner; Max-Age=0; SameSite=Lax`;
  }
}

export function clearRoleCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; path=/owner; Max-Age=0; SameSite=Lax`;
}

/* ── Legacy token migration ──────────────────────────────────────── */

const SANCTUM_TOKEN_KEY_CLIENT = 'kh_sanctum_token_client';
const SANCTUM_TOKEN_KEY_OWNER = 'kh_sanctum_token_owner';
const LEGACY_SANCTUM_TOKEN_KEY = 'kh_sanctum_token';

/**
 * One-time migration: move any legacy localStorage tokens to in-memory,
 * then delete them from localStorage permanently.
 */
export async function migrateLegacyTokens(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const legacy =
    localStorage.getItem(LEGACY_SANCTUM_TOKEN_KEY) ||
    localStorage.getItem(SANCTUM_TOKEN_KEY_CLIENT) ||
    localStorage.getItem(SANCTUM_TOKEN_KEY_OWNER);

  // Always clean up localStorage regardless
  localStorage.removeItem(LEGACY_SANCTUM_TOKEN_KEY);
  localStorage.removeItem(SANCTUM_TOKEN_KEY_CLIENT);
  localStorage.removeItem(SANCTUM_TOKEN_KEY_OWNER);

  if (!legacy) {
    return;
  }

  // Validate the legacy token before trusting it
  registerTokenGetter(() => Promise.resolve(legacy));
  try {
    await authService.me();
    inMemoryToken = legacy;
  } catch {
    inMemoryToken = null;
  }
}

/* ── Session storage cleanup ─────────────────────────────────────── */

const SESSION_KEYS = [
  'clerk_auth_email_hint',
  'clerk_auth_prefill',
  'kh_flw_tx_ref',
  'kh_flw_reference',
  'kh_just_unlocked',
  'kh_redirect_after_login',
  'kh_registration_intent',
  'kh_register_account_role',
  'kh_register_role',
  'kh_owner_redirect',
] as const;

export function clearSessionStorage(): void {
  for (const key of SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
}
