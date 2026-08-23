'use client';

/**
 * useClerkSync — handles the full auth resolution lifecycle.
 *
 * Two paths:
 *  A) Clerk NOT signed-in → session-first (/auth/me with cookie), then
 *     in-memory Bearer fallback, with a synchronous verification-pending guard
 *     to avoid loading flashes on OTP / verify-email pages.
 *  B) Clerk signed-in → exchange JWT for a Sanctum session, handle OTP,
 *     context-isolate owner vs customer, role-aware persistence + routing.
 *
 * This hook owns NO state — it only dispatches to the setters it receives.
 * State ownership stays in AuthProvider so the context value stays stable.
 */

import {
  clearRoleCookie,
  clearSanctumInMemoryOnly,
  getInMemoryToken,
  hasAnySanctumInMemory,
  migrateLegacyTokens,
  persistClientToken,
  persistOwnerToken,
  registerInMemoryGetter,
  setRoleCookie,
} from '@/lib/auth/auth-session';
import { registerTokenGetter } from '@/lib/auth/auth-token';
import { consumeReturnTo } from '@/lib/auth/return-to';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { isAxiosError } from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';

/** Set by register flow; Bearer for verification APIs only (not full session). */
const KH_VERIFY_TOKEN_CLIENT = 'kh_verify_token_client';
const KH_VERIFY_TOKEN_OWNER = 'kh_verify_token_owner';

const PENDING_EMAIL_VERIFICATION_PATHS = new Set<string>([
  '/owner/auth/verify-otp',
  '/verify-email',
  '/verify-otp',
]);

const POST_REGISTRATION_PATHS = new Set<string>(['/register']);

interface ClerkSyncSetters {
  setUserState: (u: User | null) => void;
  setToken: (t: string | null) => void;
  setIsExchanging: (v: boolean) => void;
  setHasResolvedInitialAuth: (v: boolean) => void;
  clearSession: () => void;
  userRef: React.MutableRefObject<User | null>;
}

export function useClerkSync(
  isLoggingOut: boolean,
  setters: ClerkSyncSetters
): void {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const {
    setUserState,
    setToken,
    setIsExchanging,
    setHasResolvedInitialAuth,
    clearSession,
    userRef,
  } = setters;

  const authRunRef = useRef(0);
  const pathnameRef = useRef<string | null>(null);
  const clerkExchangeDoneRef = useRef(false);
  // Marks that the signed-out resolution (Path A: session cookie / guest) has
  // completed at least once. A plain client-side navigation must NOT re-run the
  // full resolution — doing so flips isExchanging (→ full-page loader) and
  // refetches /auth/me on every page change. Reset when Clerk signs in so a
  // later sign-out triggers a fresh bootstrap. Explicit revalidation (e.g.
  // after a profile edit) goes through AuthProvider.refreshUser(), not here.
  const signedOutResolvedRef = useRef(false);
  const clerkGetTokenRef = useRef(getToken);
  clerkGetTokenRef.current = getToken;

  useLayoutEffect(() => {
    pathnameRef.current = pathname ?? null;
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded || isLoggingOut) return;

    const runId = ++authRunRef.current;

    // ── Path A: Clerk NOT signed-in ──────────────────────────────────────────
    if (!isSignedIn) {
      clerkExchangeDoneRef.current = false;

      // Synchronous verification-pending guard (no loading flash on OTP pages)
      if (typeof window !== 'undefined') {
        const syncPath = pathnameRef.current ?? '';
        const syncIsOwnerPath = syncPath.startsWith('/owner');
        const syncVerifyKey = syncIsOwnerPath
          ? KH_VERIFY_TOKEN_OWNER
          : KH_VERIFY_TOKEN_CLIENT;
        const syncHasToken = POST_REGISTRATION_PATHS.has(syncPath)
          ? Boolean(
              sessionStorage.getItem(KH_VERIFY_TOKEN_CLIENT) ||
              sessionStorage.getItem(KH_VERIFY_TOKEN_OWNER)
            )
          : Boolean(sessionStorage.getItem(syncVerifyKey));
        const syncActiveKey = POST_REGISTRATION_PATHS.has(syncPath)
          ? sessionStorage.getItem(KH_VERIFY_TOKEN_OWNER)
            ? KH_VERIFY_TOKEN_OWNER
            : KH_VERIFY_TOKEN_CLIENT
          : syncVerifyKey;
        const syncIsPending =
          PENDING_EMAIL_VERIFICATION_PATHS.has(syncPath) ||
          (POST_REGISTRATION_PATHS.has(syncPath) && syncHasToken);

        if (syncIsPending && syncHasToken) {
          registerTokenGetter(() =>
            Promise.resolve(
              typeof window !== 'undefined'
                ? sessionStorage.getItem(syncActiveKey)
                : null
            )
          );
          setUserState(null);
          clearRoleCookie();
          setToken(null);
          setHasResolvedInitialAuth(true);
          return;
        }
      }

      // Already resolved once: a mere navigation must not re-enter the auth
      // gate nor refetch /auth/me. Keep the resolved state and bail early.
      if (signedOutResolvedRef.current) {
        setIsExchanging(false);
        setHasResolvedInitialAuth(true);
        return;
      }

      setIsExchanging(true);

      void (async () => {
        await migrateLegacyTokens();
        if (runId !== authRunRef.current) return;

        // Session-first (cookie); else Bearer (SPA ↔ API cross-origin)
        try {
          const hasBearer = Boolean(getInMemoryToken());
          if (hasBearer) {
            registerInMemoryGetter();
          } else {
            registerTokenGetter(() => Promise.resolve(null));
          }
          const sessionUser = await authService.me();
          if (runId !== authRunRef.current) return;
          setUserState(sessionUser);
          setRoleCookie(sessionUser.role ?? UserRole.CUSTOMER);
          setToken(null);
          setIsExchanging(false);
          signedOutResolvedRef.current = true;
          setHasResolvedInitialAuth(true);
          return;
        } catch {
          if (runId !== authRunRef.current) return;
        }

        registerInMemoryGetter();

        if (!getInMemoryToken()) {
          setToken(null);
          setUserState(null);
          clearRoleCookie();
          setIsExchanging(false);
          signedOutResolvedRef.current = true;
          setHasResolvedInitialAuth(true);
          return;
        }

        setToken(getInMemoryToken());

        try {
          const laravelUser = await authService.me();
          if (runId !== authRunRef.current) return;
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
        } catch {
          if (runId !== authRunRef.current) return;
          const currentPath = pathnameRef.current ?? '';
          const isOwnerAuthRoute = currentPath.startsWith('/owner/auth/');
          if (isOwnerAuthRoute) {
            setUserState(null);
            clearRoleCookie();
          } else {
            clearSession();
            setUserState(null);
            clearRoleCookie();
          }
          if (currentPath.startsWith('/owner') && !isOwnerAuthRoute) {
            router.replace('/owner/login');
          }
        } finally {
          if (runId !== authRunRef.current) return;
          setIsExchanging(false);
          signedOutResolvedRef.current = true;
          setHasResolvedInitialAuth(true);
        }
      })();

      return;
    }

    // ── Path B: Clerk signed-in ──────────────────────────────────────────────
    // A live Clerk session supersedes any signed-out resolution; clear the
    // Path A marker so a later sign-out bootstraps the session again.
    signedOutResolvedRef.current = false;
    const currentPathForClerk = pathnameRef.current ?? '';
    const isOAuthCallback = currentPathForClerk === '/sso-callback';

    if (clerkExchangeDoneRef.current) {
      const hasLaravelUser = userRef.current != null;

      if (isOAuthCallback && !hasLaravelUser) {
        clerkExchangeDoneRef.current = false;
      } else {
        setIsExchanging(false);
        setHasResolvedInitialAuth(true);
        if (isOAuthCallback && hasLaravelUser) {
          const intentRaw =
            typeof window !== 'undefined'
              ? sessionStorage.getItem('kh_registration_intent')
              : null;
          const roleCookie =
            typeof document !== 'undefined'
              ? document.cookie
                  .split('; ')
                  .find((r) => r.startsWith('kh_role='))
                  ?.split('=')[1]
              : null;
          const isOwner =
            roleCookie === 'agent' ||
            roleCookie === 'admin' ||
            intentRaw === 'agent';
          // The OAuth round-trip leaves our origin, so `?redirect=` is long
          // gone by the time Clerk lands on /sso-callback — the destination is
          // recovered from sessionStorage instead.
          router.replace(consumeReturnTo(isOwner ? 'owner' : 'client'));
        }
        return;
      }
    }

    if (hasAnySanctumInMemory() && !isOAuthCallback) {
      clerkExchangeDoneRef.current = true;
      setIsExchanging(false);
      setHasResolvedInitialAuth(true);
      return;
    }

    setIsExchanging(true);

    void (async () => {
      // Clerk can take a moment to issue the JWT after isSignedIn=true.
      // Retry up to 5 times (2.5 s total) before giving up.
      let clerkToken: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          clerkToken = await clerkGetTokenRef.current();
        } catch {
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
          return;
        }
        if (clerkToken) break;
        if (attempt < 4) {
          await new Promise((r) => setTimeout(r, 500));
          if (runId !== authRunRef.current) return;
        }
      }

      try {
        if (runId !== authRunRef.current) return;

        const intentRaw =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('kh_registration_intent')
            : null;

        if (!clerkToken) {
          console.error(
            '[useClerkSync] getToken() returned null after retries — Clerk session unavailable'
          );
          const currentPath = pathnameRef.current ?? '';
          const isOwnerCtx =
            currentPath.startsWith('/owner') || intentRaw === 'agent';
          router.replace(isOwnerCtx ? '/owner/login' : '/login');
          return;
        }

        registerTokenGetter(() => clerkGetTokenRef.current());

        try {
          const registrationIntent =
            intentRaw === 'agent' ? 'agent' : 'customer';
          const result = await authService.clerkExchange(clerkToken, {
            registration_intent: registrationIntent,
          });

          if (runId !== authRunRef.current) return;

          if ('state' in result && result.state === 'otp_required') {
            clerkExchangeDoneRef.current = true;
            clearSanctumInMemoryOnly();
            setUserState(null);
            sessionStorage.setItem(
              'clerk_auth_email_hint',
              result.email_hint ?? ''
            );
            router.replace('/verify-otp');
            return;
          }

          const {
            token: sanctumToken,
            user: laravelUser,
            panel_sso_url,
            expires_at,
          } = result as {
            token: string;
            user: User;
            panel_sso_url: string | null;
            expires_at: string | null;
          };
          const expiresAtMs = expires_at
            ? new Date(expires_at).getTime()
            : undefined;

          clerkExchangeDoneRef.current = true;

          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('kh_registration_intent');
          }

          const skipPanelSso = laravelUser.role === UserRole.AGENT;
          const panelUrl = skipPanelSso ? null : panel_sso_url;

          if (panelUrl) {
            if (!redirectToTrustedUrl(panelUrl)) {
              clearSession();
              setUserState(null);
              router.replace('/login');
            }
            return;
          }

          // Context isolation: owner vs customer role/path
          const path = pathnameRef.current ?? '';
          const expectedOwnerContext =
            path.startsWith('/owner') || intentRaw === 'agent';
          const isOwnerRole = laravelUser.role === UserRole.AGENT;

          if (isOwnerRole && !expectedOwnerContext) {
            persistOwnerToken(sanctumToken, expiresAtMs);
            setToken(sanctumToken);
            setUserState(laravelUser);
            setRoleCookie(laravelUser.role ?? UserRole.AGENT);
            router.replace(consumeReturnTo('owner'));
            return;
          }

          if (
            !isOwnerRole &&
            (path.startsWith('/owner') || intentRaw === 'agent')
          ) {
            clearSanctumInMemoryOnly();
            setUserState(null);
            clearRoleCookie();
            router.replace('/owner/login');
            return;
          }

          if (isOwnerRole) {
            persistOwnerToken(sanctumToken, expiresAtMs);
          } else {
            persistClientToken(sanctumToken, expiresAtMs);
          }
          setToken(sanctumToken);
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);

          // Honour the captured destination instead of always landing on the
          // space's home page. `consumeReturnTo` falls back to that home page
          // when nothing safe was stored, so behaviour is unchanged otherwise.
          if (isOwnerRole) {
            if (!path.startsWith('/owner')) {
              router.replace(consumeReturnTo('owner'));
            }
          } else if (path.startsWith('/owner') || path === '/sso-callback') {
            router.replace(consumeReturnTo('client'));
          }
        } catch (err) {
          console.error('[useClerkSync] clerkExchange failed:', err);
          if (runId !== authRunRef.current) return;

          if (isAxiosError(err) && err.response?.status === 403) {
            const data = err.response.data as {
              email_verification_required?: boolean;
              email?: string;
              role?: string;
            };
            if (data?.email_verification_required) {
              clerkExchangeDoneRef.current = true;
              clearSession();
              setUserState(null);
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('kh_registration_intent');
              }
              const verifiedEmail = data.email ?? '';
              const role = data.role ?? 'customer';
              const isOwnerRole = role === 'agent' || intentRaw === 'agent';
              const emailKey = isOwnerRole
                ? 'kh_verify_email_owner'
                : 'kh_verify_email_client';
              sessionStorage.setItem(emailKey, verifiedEmail);
              sessionStorage.setItem(
                'kh_register_role',
                isOwnerRole ? 'agent' : 'customer'
              );
              router.replace(
                isOwnerRole ? '/owner/auth/verify-otp' : '/verify-email'
              );
              return;
            }
          }

          clearSession();
          setUserState(null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('kh_registration_intent');
          }
          const failPath = pathnameRef.current ?? '';
          const failIsOwner =
            failPath.startsWith('/owner') || intentRaw === 'agent';
          router.replace(failIsOwner ? '/owner/login' : '/login');
        }
      } finally {
        if (runId !== authRunRef.current) return;
        setIsExchanging(false);
        setHasResolvedInitialAuth(true);
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    clerkUser?.id,
    pathname,
    clearSession,
    router,
    isLoggingOut,
    setUserState,
    setToken,
    setIsExchanging,
    setHasResolvedInitialAuth,
    userRef,
  ]);
}
