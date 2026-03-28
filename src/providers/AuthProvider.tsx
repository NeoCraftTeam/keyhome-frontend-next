'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { resetCsrfState } from '@/lib/api';
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

/**
 * In-memory token store — never persisted to localStorage (XSS-safe).
 * The httpOnly session cookie (withCredentials: true) is the primary auth mechanism.
 * This in-memory token is the Bearer fallback for cross-origin SPA→API scenarios.
 */
let inMemoryToken: string | null = null;

/** Legacy localStorage keys — cleared on migration, never written to again */
const SANCTUM_TOKEN_KEY_CLIENT = 'kh_sanctum_token_client';
const SANCTUM_TOKEN_KEY_OWNER = 'kh_sanctum_token_owner';
const LEGACY_SANCTUM_TOKEN_KEY = 'kh_sanctum_token';

/** Cookie used by the edge proxy to gate /owner routes */
const ROLE_COOKIE = 'kh_role';
const ROLE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function setRoleCookie(role: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const isOwner = role === UserRole.AGENT || role === UserRole.ADMIN;
  const path = isOwner ? '/owner' : '/';
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=${path}; SameSite=Lax; Max-Age=${ROLE_COOKIE_MAX_AGE}`;
}

function clearRoleCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  // Clear both possible paths to ensure complete logout
  document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; path=/owner; Max-Age=0; SameSite=Lax`;
}

function hasAnySanctumInMemory(): boolean {
  return inMemoryToken !== null;
}

/**
 * One-time migration: move any legacy localStorage tokens to in-memory,
 * then delete them from localStorage permanently.
 */
async function migrateLegacyTokens(): Promise<void> {
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
    // Invalid token — discard
    inMemoryToken = null;
  }
}

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

  const registerInMemoryTokenGetter = useCallback(() => {
    registerTokenGetter(async () => inMemoryToken);
  }, []);

  /** Persist a Sanctum token in-memory only (never localStorage). */
  const persistSession = useCallback((sanctumToken: string) => {
    inMemoryToken = sanctumToken;
    registerTokenGetter(() => Promise.resolve(sanctumToken));
    setToken(sanctumToken);
  }, []);

  const clearSession = useCallback(() => {
    inMemoryToken = null;
    registerTokenGetter(() => Promise.resolve(null));
    setToken(null);
  }, []);

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
        // Try session cookie first, then fall back to in-memory token.
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
          // No active session — fall through to in-memory token
        }

        // --- In-memory token fallback (from migration or previous login) ---
        registerInMemoryTokenGetter();

        if (!inMemoryToken) {
          setToken(null);
          setUserState(null);
          clearRoleCookie();
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
          return;
        }

        setToken(inMemoryToken);

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
    registerInMemoryTokenGetter,
    router,
    signOut,
    getToken,
  ]);

  const isAuthenticated = !!user;
  const isLoading = !isLoaded || !hasResolvedInitialAuth || isExchanging;

  // Listen for 401 responses on non-auth endpoints and clear local auth state
  // so components stop making authenticated requests with stale credentials.
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
      sessionStorage.removeItem('clerk_auth_email_hint');
      sessionStorage.removeItem('clerk_auth_prefill');
      sessionStorage.removeItem('kh_registration_intent');

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

      sessionStorage.removeItem('clerk_auth_email_hint');
      sessionStorage.removeItem('clerk_auth_prefill');
      sessionStorage.removeItem('kh_flw_tx_ref');
      sessionStorage.removeItem('kh_flw_reference');
      sessionStorage.removeItem('kh_just_unlocked');
      sessionStorage.removeItem('kh_redirect_after_login');
      sessionStorage.removeItem('kh_registration_intent');
      clearRoleCookie();

      if (isSignedIn) {
        clearSession();
      } else {
        // Use unified session clearing
        clearSession();
      }
      setUserState(null);

      await new Promise((resolve) =>
        setTimeout(resolve, LOGOUT_OVERLAY_DURATION_MS)
      );

      if (isSignedIn) {
        try {
          await Promise.race([
            signOut({
              redirectUrl: `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : '/home'}`,
            }),
            new Promise((resolve) =>
              setTimeout(resolve, CLERK_SIGN_OUT_FALLBACK_MS)
            ),
          ]);
        } catch {
          // Fall through to hard redirect fallback.
        }

        window.location.replace(
          redirectTo.startsWith('/') ? redirectTo : '/home'
        );

        return;
      }

      setIsLoggingOut(false);
      router.replace(redirectTo.startsWith('/') ? redirectTo : '/home');
    },
    [isSignedIn, signOut, clearSession, router]
  );

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      if (isSignedIn) {
        clearSession();
        setUserState(null);
        await signOut();
        router.push('/home');

        return;
      }
      // Use unified session clearing
      clearSession();
      setUserState(null);
      router.push('/home');
    }
  }, [isSignedIn, signOut, clearSession, router]);

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
