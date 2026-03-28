'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { resetCsrfState } from '@/lib/api';
import {
  clearInMemoryToken,
  clearRoleCookie,
  clearSessionStorage,
  getInMemoryToken,
  hasAnySanctumInMemory,
  migrateLegacyTokens,
  persistInMemoryToken,
  registerInMemoryGetter,
  setRoleCookie,
} from '@/lib/auth-session';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';
import {
  useClerk,
  useAuth as useClerkAuth,
  useSignIn,
  useUser,
} from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Re-export for tests
export { __resetModuleStateForTests } from '@/lib/auth-session';

const LOGOUT_OVERLAY_DURATION_MS = 3500;
const CLERK_SIGN_OUT_FALLBACK_MS = 1200;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginOwner: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (
    provider: OAuthProvider,
    options?: { registrationIntent?: 'customer' | 'agent' }
  ) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  /** Called by /verify-email and /complete-profile after successful auth */
  finalizeAuth: (token: string, user: User, panelSsoUrl: string | null) => void;
  /** Returns a fresh Clerk session JWT, or null if unavailable */
  getClerkToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signIn } = useSignIn();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const authRunRef = useRef(0);
  const pathnameRef = useRef<string | null>(null);
  const clerkExchangeDoneRef = useRef(false);

  useLayoutEffect(() => {
    pathnameRef.current = pathname ?? null;
  }, [pathname]);

  /* ── Session helpers ──────────────────────────────────────────── */

  const persistSession = useCallback((sanctumToken: string) => {
    persistInMemoryToken(sanctumToken);
    setToken(sanctumToken);
  }, []);

  const clearSession = useCallback(() => {
    clearInMemoryToken();
    setToken(null);
  }, []);

  /* ── Initial auth resolution ──────────────────────────────────── */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const runId = ++authRunRef.current;

    if (!isSignedIn) {
      clerkExchangeDoneRef.current = false;
      setIsExchanging(true);

      void (async () => {
        await migrateLegacyTokens();

        if (runId !== authRunRef.current) {
          return;
        }

        // --- Session-first authentication (httpOnly cookie) ---
        try {
          registerTokenGetter(() => Promise.resolve(null));
          const sessionUser = await authService.me();
          if (runId !== authRunRef.current) {
            return;
          }
          setUserState(sessionUser);
          setRoleCookie(sessionUser.role ?? UserRole.CUSTOMER);
          setToken(null);
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
          return;
        } catch {
          if (runId !== authRunRef.current) {
            return;
          }
        }

        // --- In-memory token fallback ---
        registerInMemoryGetter();

        if (!getInMemoryToken()) {
          setToken(null);
          setUserState(null);
          clearRoleCookie();
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
          return;
        }

        setToken(getInMemoryToken());

        try {
          const laravelUser = await authService.me();
          if (runId !== authRunRef.current) {
            return;
          }
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
        } catch {
          if (runId !== authRunRef.current) {
            return;
          }
          clearSession();
          setUserState(null);
          clearRoleCookie();
          router.replace(
            pathnameRef.current?.startsWith('/owner') ? '/owner/login' : '/home'
          );
        } finally {
          if (runId !== authRunRef.current) {
            return;
          }
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
        }
      })();

      return;
    }

    // --- Clerk signed-in: exchange JWT for Sanctum session ---
    setIsExchanging(true);

    if (clerkExchangeDoneRef.current) {
      setIsExchanging(false);
      return;
    }

    getToken()
      .then(async (clerkToken) => {
        if (runId !== authRunRef.current || !clerkToken) {
          return;
        }

        registerTokenGetter(() => getToken());

        try {
          const intentRaw =
            typeof window !== 'undefined'
              ? sessionStorage.getItem('kh_registration_intent')
              : null;
          const registrationIntent =
            intentRaw === 'agent' ? 'agent' : 'customer';
          const result = await authService.clerkExchange(clerkToken, {
            registration_intent: registrationIntent,
          });

          if (runId !== authRunRef.current) {
            return;
          }

          if ('state' in result && result.state === 'otp_required') {
            clerkExchangeDoneRef.current = true;
            if (hasAnySanctumInMemory()) {
              clearSession();
              setUserState(null);
              sessionStorage.removeItem('clerk_auth_email_hint');
              sessionStorage.removeItem('clerk_auth_prefill');
              sessionStorage.removeItem('kh_registration_intent');
              await signOut();
              router.replace('/home');

              return;
            }
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
          } = result as {
            token: string;
            user: User;
            panel_sso_url: string | null;
          };

          clerkExchangeDoneRef.current = true;

          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('kh_registration_intent');
          }

          const panelUrl =
            laravelUser.role === UserRole.AGENT ? null : panel_sso_url;

          if (panelUrl) {
            if (!redirectToTrustedUrl(panelUrl)) {
              clearSession();
              setUserState(null);
              router.replace('/login');
            }

            return;
          }

          persistSession(sanctumToken);
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);

          const path = pathnameRef.current ?? '';
          if (
            laravelUser.role === UserRole.AGENT ||
            laravelUser.role === UserRole.ADMIN
          ) {
            if (!path.startsWith('/owner')) {
              router.replace('/owner/dashboard');
            }
          } else if (path.startsWith('/owner')) {
            router.replace('/home');
          }
        } catch {
          if (runId !== authRunRef.current) {
            return;
          }
          clearSession();
          setUserState(null);
        }
      })
      .finally(() => {
        if (runId !== authRunRef.current) {
          return;
        }
        setIsExchanging(false);
        setHasResolvedInitialAuth(true);
      });
  }, [
    isLoaded,
    isSignedIn,
    clerkUser?.id,
    clearSession,
    persistSession,
    router,
    signOut,
    getToken,
  ]);

  const isAuthenticated = !!user;
  const isLoading = !isLoaded || !hasResolvedInitialAuth || isExchanging;

  /* ── 401 listener ─────────────────────────────────────────────── */

  useEffect(() => {
    const handleAuthExpired = () => {
      if (!user) {
        return;
      }
      registerTokenGetter(() => Promise.resolve(null));
      setToken(null);
      setUserState(null);
      clearRoleCookie();
    };
    window.addEventListener('kh:auth-expired', handleAuthExpired);
    return () =>
      window.removeEventListener('kh:auth-expired', handleAuthExpired);
  }, [user]);

  /* ── Auth actions ─────────────────────────────────────────────── */

  const setUser = useCallback((u: User) => {
    setUserState(u);
  }, []);

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

      persistSession(sanctumToken);
      setUserState(laravelUser);
      setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
      clearSessionStorage();

      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
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
    [clearSession, persistSession, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password);

      if (laravelUser.role !== UserRole.CUSTOMER) {
        throw new Error(
          'Accès réservé aux clients. Utilisez le panneau propriétaire.'
        );
      }

      persistSession(sanctumToken);
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
    [persistSession, router]
  );

  const loginOwner = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password);

      if (
        laravelUser.role !== UserRole.AGENT &&
        laravelUser.role !== UserRole.ADMIN
      ) {
        throw new Error(
          'Accès réservé aux propriétaires et agences. Créez un compte bailleur.'
        );
      }

      persistSession(sanctumToken);
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
    [persistSession, router]
  );

  const loginWithOAuth = useCallback(
    async (
      provider: OAuthProvider,
      options?: { registrationIntent?: 'customer' | 'agent' }
    ) => {
      if (!signIn) {
        return;
      }

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
        redirectUrlComplete: '/home',
      });
    },
    [signIn, isSignedIn, signOut]
  );

  const logout = useCallback(
    async (redirectTo = '/home') => {
      ++authRunRef.current;
      clerkExchangeDoneRef.current = false;
      setIsLoggingOut(true);
      resetCsrfState();

      clearSessionStorage();
      clearRoleCookie();
      clearSession();
      setUserState(null);

      await new Promise((resolve) =>
        setTimeout(resolve, LOGOUT_OVERLAY_DURATION_MS)
      );

      const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/home';

      if (isSignedIn) {
        try {
          await Promise.race([
            signOut({
              redirectUrl: `${window.location.origin}${safeRedirect}`,
            }),
            new Promise((resolve) =>
              setTimeout(resolve, CLERK_SIGN_OUT_FALLBACK_MS)
            ),
          ]);
        } catch {
          // Fall through to hard redirect fallback.
        }

        window.location.replace(safeRedirect);

        return;
      }

      setIsLoggingOut(false);
      router.replace(safeRedirect);
    },
    [isSignedIn, signOut, clearSession, router]
  );

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      clearSession();
      setUserState(null);
      if (isSignedIn) {
        await signOut();
      }
      router.push('/home');
    }
  }, [isSignedIn, signOut, clearSession, router]);

  /* ── Context value ────────────────────────────────────────────── */

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      isLoggingOut,
      login,
      loginOwner,
      loginWithOAuth,
      logout,
      setUser,
      refreshUser,
      finalizeAuth,
      getClerkToken: getToken,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      isLoggingOut,
      login,
      loginOwner,
      loginWithOAuth,
      logout,
      setUser,
      refreshUser,
      finalizeAuth,
      getToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
