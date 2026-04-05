'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { authService } from '@/services/auth.service';
import { UserRole } from '@/types';

/* ── Dual in-memory token store ──────────────────────────────────────
 * Never persisted to localStorage (XSS-safe).
 * Owner and client sessions are fully isolated: each has its own
 * in-memory token slot.  The Axios interceptor picks the correct one
 * based on the current route (see `getActiveToken`).
 * ─────────────────────────────────────────────────────────────────── */

let ownerInMemoryToken: string | null = null;
let clientInMemoryToken: string | null = null;

/** @internal — Reset module state between tests. Not for production use. */
export function __resetModuleStateForTests(): void {
  ownerInMemoryToken = null;
  clientInMemoryToken = null;
}

/** Returns whichever token matches the current route context. */
export function getActiveToken(pathname?: string): string | null {
  const path =
    pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  return path.startsWith('/owner') ? ownerInMemoryToken : clientInMemoryToken;
}

export function getInMemoryToken(): string | null {
  return getActiveToken();
}

export function getOwnerInMemoryToken(): string | null {
  return ownerInMemoryToken;
}

export function getClientInMemoryToken(): string | null {
  return clientInMemoryToken;
}

export function hasAnySanctumInMemory(): boolean {
  return ownerInMemoryToken !== null || clientInMemoryToken !== null;
}

/** Clears Laravel bearer only; does not touch {@link registerTokenGetter} (Clerk OAuth + OTP). */
export function clearSanctumInMemoryOnly(): void {
  ownerInMemoryToken = null;
  clientInMemoryToken = null;
}

/* ── Session persistence ─────────────────────────────────────────── */

/** Store a Sanctum token in the owner slot (never localStorage). */
export function persistOwnerToken(sanctumToken: string): void {
  ownerInMemoryToken = sanctumToken;
  registerTokenGetter(async () => getActiveToken());
}

/** Store a Sanctum token in the client slot (never localStorage). */
export function persistClientToken(sanctumToken: string): void {
  clientInMemoryToken = sanctumToken;
  registerTokenGetter(async () => getActiveToken());
}

/**
 * Context-aware wrapper: persists to owner or client slot based on current route.
 * Kept for backward compatibility with existing callers.
 */
export function persistInMemoryToken(sanctumToken: string): void {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/owner')) {
    persistOwnerToken(sanctumToken);
  } else {
    persistClientToken(sanctumToken);
  }
}

export function clearOwnerToken(): void {
  ownerInMemoryToken = null;
  registerTokenGetter(async () => getActiveToken());
}

export function clearClientToken(): void {
  clientInMemoryToken = null;
  registerTokenGetter(async () => getActiveToken());
}

export function clearInMemoryToken(): void {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/owner')) {
    clearOwnerToken();
  } else {
    clearClientToken();
  }
}

export function clearAllInMemoryTokens(): void {
  ownerInMemoryToken = null;
  clientInMemoryToken = null;
  registerTokenGetter(() => Promise.resolve(null));
}

export function registerInMemoryGetter(): void {
  registerTokenGetter(async () => getActiveToken());
}

/* ── Role cookie management ──────────────────────────────────────── */

const ROLE_COOKIE = 'kh_role';
const ROLE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function setRoleCookie(role: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const isOwner = role === UserRole.AGENT || role === UserRole.ADMIN;

  // Strict path scoping for role cookies.
  // The browser only sends the 'agent' role cookie to /owner routes
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
    const user = await authService.me();
    // Place legacy token in the correct slot based on user role
    if (user.role === UserRole.AGENT || user.role === UserRole.ADMIN) {
      ownerInMemoryToken = legacy;
    } else {
      clientInMemoryToken = legacy;
    }
  } catch {
    ownerInMemoryToken = null;
    clientInMemoryToken = null;
  }
}

/* ── Session storage cleanup ─────────────────────────────────────── */

/** Keys common to both contexts — always cleared. */
const SHARED_SESSION_KEYS = [
  'clerk_auth_email_hint',
  'clerk_auth_prefill',
  'kh_flw_tx_ref',
  'kh_flw_reference',
  'kh_just_unlocked',
  'user_id',
] as const;

/** Keys that belong exclusively to the client (customer) flow. */
const CLIENT_SESSION_KEYS = [
  'kh_verify_token_client',
  'kh_verify_email_client',
  'kh_redirect_after_login',
  'kh_register_account_role',
  'kh_register_role',
] as const;

/** Keys that belong exclusively to the owner (agent) flow. */
const OWNER_SESSION_KEYS = [
  'kh_verify_token_owner',
  'kh_verify_email_owner',
  'kh_owner_redirect',
  'kh_owner_post_otp_token',
  'kh_registration_intent',
] as const;

/**
 * Context-aware session cleanup.
 * - No argument: clears everything (backward compat).
 * - `'client'`: shared + client-only keys.
 * - `'owner'`: shared + owner-only keys.
 */
export function clearSessionStorage(context?: 'client' | 'owner'): void {
  for (const key of SHARED_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }

  if (!context || context === 'client') {
    for (const key of CLIENT_SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
  }

  if (!context || context === 'owner') {
    for (const key of OWNER_SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
  }
}
