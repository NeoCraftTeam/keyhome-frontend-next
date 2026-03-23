'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { resetCsrfState } from '@/lib/api';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';
import { useClerk, useAuth as useClerkAuth, useSignIn, useUser } from '@clerk/nextjs';
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

const SANCTUM_TOKEN_KEY_CLIENT = 'kh_sanctum_token_client';
const SANCTUM_TOKEN_KEY_OWNER = 'kh_sanctum_token_owner';
/** Legacy single key — migrated once to scoped keys */
const LEGACY_SANCTUM_TOKEN_KEY = 'kh_sanctum_token';

/** Cookie used by the edge proxy to gate /owner routes */
const ROLE_COOKIE = 'kh_role';
const ROLE_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function setRoleCookie(role: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; SameSite=Lax; Max-Age=${ROLE_COOKIE_MAX_AGE}`;
}

function clearRoleCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${ROLE_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}

function storageScopeForRole(role: UserRole | null | undefined): 'client' | 'owner' {
  return role === UserRole.CUSTOMER ? 'client' : 'owner';
}

function sanctumKeyForScope(scope: 'client' | 'owner'): string {
  return scope === 'owner' ? SANCTUM_TOKEN_KEY_OWNER : SANCTUM_TOKEN_KEY_CLIENT;
}

function hasAnySanctumInStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    localStorage.getItem(SANCTUM_TOKEN_KEY_CLIENT)
      || localStorage.getItem(SANCTUM_TOKEN_KEY_OWNER)
      || localStorage.getItem(LEGACY_SANCTUM_TOKEN_KEY)
  );
}

async function migrateLegacySanctumToken(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const legacy = localStorage.getItem(LEGACY_SANCTUM_TOKEN_KEY);
  if (!legacy) {
    return;
  }

  registerTokenGetter(() => Promise.resolve(legacy));

  try {
    const laravelUser = await authService.me();
    const key = sanctumKeyForScope(storageScopeForRole(laravelUser.role));
    localStorage.setItem(key, legacy);
  } catch {
    // Invalid legacy token — dropped when key is removed below
  } finally {
    localStorage.removeItem(LEGACY_SANCTUM_TOKEN_KEY);
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
    options?: { registrationIntent?: 'customer' | 'agent' },
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

  const registerPathAwareTokenGetter = useCallback(() => {
    registerTokenGetter(async () => {
      if (typeof window === 'undefined') {
        return null;
      }
      const p = pathnameRef.current ?? '';
      const key = p.startsWith('/owner') ? SANCTUM_TOKEN_KEY_OWNER : SANCTUM_TOKEN_KEY_CLIENT;

      return localStorage.getItem(key);
    });
  }, []);

  const persistPasswordSession = useCallback(
    (sanctumToken: string, _scope: 'client' | 'owner') => {
      // httpOnly session cookie is the primary auth mechanism.
      // Keep the Sanctum token as Bearer fallback for environments where
      // third-party cookies are blocked (cross-origin SPA → API).
      registerTokenGetter(() => Promise.resolve(sanctumToken));
      setToken(sanctumToken);
    },
    []
  );

  const persistClerkSession = useCallback((sanctumToken: string, _scope: 'client' | 'owner') => {
    // httpOnly session cookie is the primary auth mechanism.
    // Keep the Sanctum token as Bearer fallback for environments where
    // third-party cookies are blocked (cross-origin SPA → API).
    registerTokenGetter(() => Promise.resolve(sanctumToken));
    setToken(sanctumToken);
  }, []);

  const clearSanctumTokens = useCallback(
    (scope: 'client' | 'owner' | 'all') => {
      if (typeof window !== 'undefined') {
        if (scope === 'all' || scope === 'client') {
          localStorage.removeItem(SANCTUM_TOKEN_KEY_CLIENT);
        }
        if (scope === 'all' || scope === 'owner') {
          localStorage.removeItem(SANCTUM_TOKEN_KEY_OWNER);
        }
        if (scope === 'all') {
          localStorage.removeItem(LEGACY_SANCTUM_TOKEN_KEY);
        }
      }

      registerTokenGetter(() => Promise.resolve(null));
      setToken(null);
    },
    []
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const runId = ++authRunRef.current;

    if (!isSignedIn) {
      clerkExchangeDoneRef.current = false;
      setIsExchanging(true);

      void (async () => {
        await migrateLegacySanctumToken();

        if (runId !== authRunRef.current) {
          return;
        }

        const ownerArea = (pathnameRef.current ?? '').startsWith('/owner');
        const storageKey = ownerArea ? SANCTUM_TOKEN_KEY_OWNER : SANCTUM_TOKEN_KEY_CLIENT;

        // --- Session-first authentication (httpOnly cookie) ---
        // Try to authenticate via session cookie before falling back to localStorage token.
        // If a valid session exists, the cookie is sent automatically (withCredentials: true).
        try {
          registerTokenGetter(() => Promise.resolve(null));
          const sessionUser = await authService.me();
          if (runId !== authRunRef.current) {
            return;
          }
          setUserState(sessionUser);
          setRoleCookie(sessionUser.role ?? UserRole.CUSTOMER);
          // Session auth succeeded — clear any leftover localStorage token
          if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
          }
          registerTokenGetter(() => Promise.resolve(null));
          setToken(null);
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);
          return;
        } catch {
          if (runId !== authRunRef.current) {
            return;
          }
          // No active session — fall through to localStorage token
        }

        // --- Fallback: localStorage Bearer token (migration path) ---
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;

        registerPathAwareTokenGetter();

        if (!storedToken) {
          setToken(null);
          setUserState(null);
          clearRoleCookie();
          setIsExchanging(false);
          setHasResolvedInitialAuth(true);

          return;
        }

        setToken(storedToken);

        try {
          const laravelUser = await authService.me();
          if (runId !== authRunRef.current) {
            return;
          }
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
          // Migration: clear localStorage, keep token as Bearer fallback
          if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
          }
          registerTokenGetter(() => Promise.resolve(storedToken));
        } catch {
          if (runId !== authRunRef.current) {
            return;
          }
          localStorage.removeItem(storageKey);
          registerTokenGetter(() => Promise.resolve(null));
          setToken(null);
          setUserState(null);
          clearRoleCookie();
          router.replace(ownerArea ? '/owner/login' : '/home');
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
          const intentRaw = typeof window !== 'undefined' ? sessionStorage.getItem('kh_registration_intent') : null;
          const registrationIntent = intentRaw === 'agent' ? 'agent' : 'customer';
          const result = await authService.clerkExchange(clerkToken, { registration_intent: registrationIntent });

          if (runId !== authRunRef.current) {
            return;
          }

          if ('state' in result && result.state === 'otp_required') {
            clerkExchangeDoneRef.current = true;
            if (hasAnySanctumInStorage()) {
              clearSanctumTokens('all');
              setUserState(null);
              sessionStorage.removeItem('clerk_auth_email_hint');
              sessionStorage.removeItem('clerk_auth_prefill');
              sessionStorage.removeItem('kh_registration_intent');
              await signOut();
              router.replace('/home');

              return;
            }
            sessionStorage.setItem('clerk_auth_email_hint', result.email_hint ?? '');
            router.replace('/verify-otp');

            return;
          }

          const { token: sanctumToken, user: laravelUser, panel_sso_url } = result as {
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
              clearSanctumTokens('all');
              setUserState(null);
              router.replace('/login');
            }

            return;
          }

          persistClerkSession(sanctumToken, storageScopeForRole(laravelUser.role));
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);

          const path = pathnameRef.current ?? '';
          if (
            laravelUser.role === UserRole.AGENT
            || laravelUser.role === UserRole.ADMIN
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
          clearSanctumTokens('all');
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
  }, [isLoaded, isSignedIn, clerkUser?.id, clearSanctumTokens, persistClerkSession, registerPathAwareTokenGetter, router, signOut, getToken]);

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
    return () => window.removeEventListener('kh:auth-expired', handleAuthExpired);
  }, [user]);

  const setUser = useCallback((u: User) => {
    setUserState(u);
  }, []);

  const finalizeAuth = useCallback(
    (sanctumToken: string, laravelUser: User, panelSsoUrl: string | null) => {
      const panelUrl = laravelUser.role === UserRole.AGENT ? null : panelSsoUrl;

      if (panelUrl) {
        if (!redirectToTrustedUrl(panelUrl)) {
          clearSanctumTokens('all');
          setUserState(null);
          router.replace('/login');
        }

        return;
      }

      persistPasswordSession(sanctumToken, storageScopeForRole(laravelUser.role));
      setUserState(laravelUser);
      setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);
      sessionStorage.removeItem('clerk_auth_email_hint');
      sessionStorage.removeItem('clerk_auth_prefill');
      sessionStorage.removeItem('kh_registration_intent');

      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else if (storageScopeForRole(laravelUser.role) === 'owner') {
        router.replace('/owner/dashboard');
      } else {
        router.replace('/home');
      }
    },
    [clearSanctumTokens, persistPasswordSession, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } = await authService.login(email, password);

      if (laravelUser.role !== UserRole.CUSTOMER) {
        throw new Error('Accès réservé aux clients. Utilisez le panneau propriétaire.');
      }

      persistPasswordSession(sanctumToken, 'client');
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
    [persistPasswordSession, router]
  );

  const loginOwner = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } = await authService.login(email, password);

      if (laravelUser.role !== UserRole.AGENT && laravelUser.role !== UserRole.ADMIN) {
        throw new Error('Accès réservé aux propriétaires et agences. Créez un compte bailleur.');
      }

      persistPasswordSession(sanctumToken, 'owner');
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
    [persistPasswordSession, router]
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider, options?: { registrationIntent?: 'customer' | 'agent' }) => {
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
          sessionStorage.setItem('kh_registration_intent', options.registrationIntent);
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

  const logout = useCallback(async (redirectTo = '/home') => {
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
      clearSanctumTokens('all');
    } else {
      const scope = pathnameRef.current?.startsWith('/owner') ? 'owner' : 'client';
      clearSanctumTokens(scope);
    }
    setUserState(null);

    await new Promise((resolve) => setTimeout(resolve, LOGOUT_OVERLAY_DURATION_MS));

    if (isSignedIn) {
      try {
        await Promise.race([
          signOut({
            redirectUrl: `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : '/home'}`,
          }),
          new Promise((resolve) => setTimeout(resolve, CLERK_SIGN_OUT_FALLBACK_MS)),
        ]);
      } catch {
        // Fall through to hard redirect fallback.
      }

      window.location.replace(redirectTo.startsWith('/') ? redirectTo : '/home');

      return;
    }

    setIsLoggingOut(false);
    router.replace(redirectTo.startsWith('/') ? redirectTo : '/home');
  }, [isSignedIn, signOut, clearSanctumTokens, router]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      if (isSignedIn) {
        clearSanctumTokens('all');
        setUserState(null);
        await signOut();
        router.push('/home');

        return;
      }
      const scope = pathnameRef.current?.startsWith('/owner') ? 'owner' : 'client';
      clearSanctumTokens(scope);
      setUserState(null);
      router.push('/home');
    }
  }, [isSignedIn, signOut, clearSanctumTokens, router]);

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
    [user, token, isLoading, isAuthenticated, isLoggingOut, login, loginOwner, loginWithOAuth, logout, setUser, refreshUser, finalizeAuth, getToken]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
