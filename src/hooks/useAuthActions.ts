'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useAuth as useClerkAuth, useSignIn } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { flushSync } from 'react-dom';
import api, { ensureCsrfCookie, resetCsrfState } from '@/lib/api';
import { removeFcmToken } from '@/lib/chat-api';
import { FCM_TOKEN_STORAGE_KEY } from '@/lib/fcm-token-key';
import {
  clearAllInMemoryTokens,
  clearRoleCookie,
  clearSessionStorage,
  getClientInMemoryToken,
  getInMemoryToken,
  getOwnerInMemoryToken,
  persistOwnerToken,
  persistClientToken,
  setRoleCookie,
  wipeBrowserStoragesForLogout,
} from '@/lib/auth-session';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { disconnectEcho } from '@/lib/echo';
import { resetChatE2eeBootstrap } from '@/lib/chat-e2ee-identity';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';

/** Minimum time the logout overlay stays visible (UX); extends if work takes longer. */
const LOGOUT_OVERLAY_MIN_MS = 3500;

interface UseAuthActionsParams {
  setUserState: (u: User | null) => void;
  setToken: (t: string | null) => void;
  setIsLoggingOut: (v: boolean) => void;
  clearSession: () => void;
  authRunRef: React.MutableRefObject<number>;
}

export function useAuthActions({
  setUserState,
  setToken,
  setIsLoggingOut,
  clearSession,
  authRunRef,
}: UseAuthActionsParams) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn, isLoaded: isClerkLoaded, getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { signIn } = useSignIn();

  const setUser = useCallback(
    (u: User) => {
      setUserState(u);
    },
    [setUserState]
  );

  const finalizeAuth = useCallback(
    (sanctumToken: string, laravelUser: User, panelSsoUrl: string | null) => {
      const panelUrl = laravelUser.role === UserRole.AGENT ? null : panelSsoUrl;

      if (panelUrl) {
        if (!redirectToTrustedUrl(panelUrl)) {
          clearSession();
          setUserState(null);
          router.replace('/login');
        }
        return;
      }

      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      const clearContext =
        laravelUser.role === UserRole.AGENT ||
        laravelUser.role === UserRole.ADMIN
          ? ('owner' as const)
          : ('client' as const);
      clearSessionStorage(clearContext);

      flushSync(() => {
        if (
          laravelUser.role === UserRole.AGENT ||
          laravelUser.role === UserRole.ADMIN
        ) {
          persistOwnerToken(sanctumToken);
        } else {
          persistClientToken(sanctumToken);
        }
        setToken(sanctumToken);
        setUserState(laravelUser);
        setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
      });

      if (returnTo) {
        router.replace(returnTo);
      } else if (
        laravelUser.role === UserRole.AGENT ||
        laravelUser.role === UserRole.ADMIN
      ) {
        router.replace('/owner/dashboard');
      } else {
        router.replace('/home');
      }
    },
    [clearSession, router, setToken, setUserState]
  );

  const login = useCallback(
    async (email: string, password: string, turnstileToken?: string | null) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password, 'client', turnstileToken);

      if (laravelUser.role !== UserRole.CUSTOMER) {
        throw new Error(
          'Accès réservé aux clients. Utilisez le panneau propriétaire.'
        );
      }

      persistClientToken(sanctumToken);
      setUserState(laravelUser);
      setRoleCookie(UserRole.CUSTOMER);

      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else {
        router.replace('/home');
      }
    },
    [router, setUserState]
  );

  const loginOwner = useCallback(
    async (email: string, password: string, turnstileToken?: string | null) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password, 'owner', turnstileToken);

      if (
        laravelUser.role !== UserRole.AGENT &&
        laravelUser.role !== UserRole.ADMIN
      ) {
        throw new Error(
          'Accès réservé aux propriétaires et agences. Créez un compte bailleur.'
        );
      }

      persistOwnerToken(sanctumToken);
      setUserState(laravelUser);
      setRoleCookie(laravelUser.role ?? UserRole.AGENT);

      const returnTo = sessionStorage.getItem('kh_owner_redirect');
      if (returnTo) {
        sessionStorage.removeItem('kh_owner_redirect');
        router.replace(returnTo);
      } else {
        router.replace('/owner/dashboard');
      }
    },
    [router, setUserState]
  );

  const loginWithOAuth = useCallback(
    async (
      provider: OAuthProvider,
      options?: { registrationIntent?: 'customer' | 'agent' }
    ) => {
      if (!signIn) return;

      const strategyMap = {
        google: 'oauth_google',
        facebook: 'oauth_facebook',
        apple: 'oauth_apple',
      } as const;

      if (typeof window !== 'undefined') {
        if (options?.registrationIntent != null) {
          sessionStorage.setItem(
            'kh_registration_intent',
            options.registrationIntent
          );
        } else {
          sessionStorage.removeItem('kh_registration_intent');
        }
      }

      if (isSignedIn) {
        await signOut();
      }

      await signIn.authenticateWithRedirect({
        strategy: strategyMap[provider],
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/sso-callback`,
      });
    },
    [signIn, isSignedIn, signOut]
  );

  const logout = useCallback(
    async (redirectTo = '/home') => {
      if (typeof window === 'undefined') {
        return;
      }

      const overlayStartedAt = Date.now();
      ++authRunRef.current;
      setIsLoggingOut(true);

      // Prefer path-scoped token, then fall back to either slot (avoids missing Bearer
      // when pathname and stored token context disagree).
      const bearerSnapshot =
        getInMemoryToken() ??
        getClientInMemoryToken() ??
        getOwnerInMemoryToken();

      const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/home';

      const postLaravelLogout = async (): Promise<void> => {
        const logoutConfig = bearerSnapshot
          ? { headers: { Authorization: `Bearer ${bearerSnapshot}` } }
          : undefined;
        await api.post('/auth/logout', undefined, logoutConfig);
      };

      const unregisterFcmDevice = async (): Promise<void> => {
        if (typeof window === 'undefined') {
          return;
        }
        const fcm =
          localStorage.getItem(FCM_TOKEN_STORAGE_KEY) ??
          sessionStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        if (!fcm) {
          return;
        }
        try {
          await removeFcmToken(fcm);
        } catch {
          /* best-effort */
        }
        localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
      };

      // 0) FCM: unregister while the Sanctum bearer is still valid (logout revokes it).
      await unregisterFcmDevice();

      // 1) Server: revoke Sanctum token + invalidate Laravel session (cookie).
      try {
        await postLaravelLogout();
      } catch {
        resetCsrfState();
        await ensureCsrfCookie();
        try {
          await postLaravelLogout();
        } catch {
          // Continue: local purge + hard navigation still limit exposure.
        }
      }

      // 2) Clerk: end session without navigating to /home first. If we let Clerk's default
      // redirect land on the same URL as our final target, `location.replace` may no-op
      // (same path) and React keeps isLoggingOut=true — overlay stuck (see layout ClerkProvider
      // signInFallbackRedirectUrl="/home").
      if (isClerkLoaded) {
        try {
          await signOut({
            redirectUrl: window.location.href,
          });
        } catch {
          try {
            await signOut();
          } catch {
            // Hard navigation / reload below still resets the app shell.
          }
        }
      }

      // 3) Client: React Query + in-memory Sanctum, role cookie, full storage wipe.
      disconnectEcho();
      clearSession();
      setUserState(null);
      clearRoleCookie();
      wipeBrowserStoragesForLogout();
      resetChatE2eeBootstrap();
      resetCsrfState();

      // 4) Overlay until minimum duration AND all steps above have finished.
      const elapsed = Date.now() - overlayStartedAt;
      const remaining = LOGOUT_OVERLAY_MIN_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }

      // 5) Always leave the Next.js shell: Clerk may have soft-navigated to the same path
      // as safeRedirect — replace() then does not remount and isLoggingOut stays true.
      flushSync(() => {
        setIsLoggingOut(false);
      });

      const target = new URL(
        safeRedirect.startsWith('/') ? safeRedirect : `/${safeRedirect}`,
        window.location.origin
      );
      const norm = (p: string) => (p.replace(/\/+$/, '') || '/') as string;
      const samePath = norm(window.location.pathname) === norm(target.pathname);

      if (samePath) {
        window.location.reload();
      } else {
        window.location.replace(target.href);
      }
    },
    [
      signOut,
      isClerkLoaded,
      clearSession,
      setUserState,
      setIsLoggingOut,
      authRunRef,
    ]
  );

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      queryClient.clear();
      clearAllInMemoryTokens();
      setToken(null);
      setUserState(null);
      if (isSignedIn) {
        await signOut();
      }
      router.push('/home');
    }
  }, [isSignedIn, signOut, router, queryClient, setToken, setUserState]);

  return {
    login,
    loginOwner,
    loginWithOAuth,
    logout,
    refreshUser,
    setUser,
    finalizeAuth,
    getClerkToken: getToken,
  };
}
