'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { resetCsrfState } from '@/lib/api';
import {
  clearAllInMemoryTokens,
  clearOwnerToken,
  clearClientToken,
  clearRoleCookie,
  clearSessionStorage,
  getInMemoryToken,
  clearSanctumInMemoryOnly,
  migrateLegacyTokens,
  persistOwnerToken,
  persistClientToken,
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
import { flushSync } from 'react-dom';
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

/** Set by register flow; Bearer for verification APIs only (not full session). */
const KH_VERIFY_TOKEN_CLIENT = 'kh_verify_token_client';
const KH_VERIFY_TOKEN_OWNER = 'kh_verify_token_owner';

const PENDING_EMAIL_VERIFICATION_PATHS = new Set<string>([
  '/owner/auth/verify-otp',
  '/owner/auth/complete-profile',
  '/verify-email',
  '/verify-otp',
  '/complete-profile',
]);

/** Paths where a registration just happened — verify token is in sessionStorage but
 *  the user has NOT yet navigated to the OTP page. Skip auth resolution here too. */
const POST_REGISTRATION_PATHS = new Set<string>(['/register']);

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
    clearAllInMemoryTokens();
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

      // ── Synchronous verification-pending guard ──────────────────────────────
      // Runs BEFORE setIsExchanging(true) to eliminate the full-app loading flash
      // that previously appeared on every navigation to an OTP / complete-profile
      // page. sessionStorage reads are synchronous — zero async work needed here.
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
      // ────────────────────────────────────────────────────────────────────────

      setIsExchanging(true);

      void (async () => {
        await migrateLegacyTokens();

        if (runId !== authRunRef.current) {
          return;
        }

        // --- Session-first (cookie) when no Bearer; else Bearer (SPA ↔ API cross-origin) ---
        try {
          const hasBearer = Boolean(getInMemoryToken());
          if (hasBearer) {
            registerInMemoryGetter();
          } else {
            registerTokenGetter(() => Promise.resolve(null));
          }
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
          const currentPath = pathnameRef.current ?? '';
          const isOwnerAuthRoute = currentPath.startsWith('/owner/auth/');
          // Post-OTP complete-profile relies on the in-memory Sanctum token; clearing it
          // here made /auth/me fail once and wiped the Bearer, breaking finalizeAuth.
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
          } else if (!currentPath.startsWith('/owner') && !isOwnerAuthRoute) {
            // Only redirect to /home if not on any auth route
          }
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
    // Guard BEFORE setIsExchanging: every pathname change while isSignedIn=true
    // re-runs this effect. If the exchange is already done (OTP pending or user
    // authenticated), bail immediately — never flash the loading state.
    if (clerkExchangeDoneRef.current) {
      setIsExchanging(false);
      setHasResolvedInitialAuth(true);
      return;
    }

    setIsExchanging(true);

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
            // Drop stale Laravel bearer if any; keep Clerk session + getter (registerTokenGetter above).
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

          // Role-aware persistence — prevents agent tokens landing in
          // clientInMemoryToken when the OAuth callback fires from a non-owner
          // path (e.g. /home or /sso-callback). getActiveToken() is path-based
          // so an agent token must live in ownerInMemoryToken from the start.
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
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('kh_registration_intent');
          }
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
    pathname,
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

      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      const clearContext =
        laravelUser.role === UserRole.AGENT ||
        laravelUser.role === UserRole.ADMIN
          ? ('owner' as const)
          : ('client' as const);
      clearSessionStorage(clearContext);

      flushSync(() => {
        // Persist token to the correct role-specific slot
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
    [clearSession, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password, 'client');

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
    [router]
  );

  const loginOwner = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } =
        await authService.login(email, password, 'owner');

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
    [router]
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

      // Always land back on /sso-callback after OAuth — never on a content
      // page like /owner/login. Using /owner/login as redirectUrlComplete was the
      // root cause of the "login page flashes before OTP page" race: Clerk would
      // hard-navigate there before our clerkExchange even started, the user saw
      // the form, then AuthProvider detected isSignedIn and routed to /verify-otp.
      // /sso-callback is already a pure loading screen so there is nothing to flash.
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
      ++authRunRef.current;
      clerkExchangeDoneRef.current = false;
      setIsLoggingOut(true);
      resetCsrfState();

      // Determine context BEFORE clearing anything
      const isOnOwnerRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/owner');
      if (typeof window !== 'undefined') {
        localStorage.clear();
        clearSessionStorage(isOnOwnerRoute ? 'owner' : 'client');
      }
      clearRoleCookie();
      if (isOnOwnerRoute) {
        clearOwnerToken();
      } else {
        clearClientToken();
      }
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
    [isSignedIn, signOut, router]
  );

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      clearAllInMemoryTokens();
      setToken(null);
      setUserState(null);
      if (isSignedIn) {
        await signOut();
      }
      router.push('/home');
    }
  }, [isSignedIn, signOut, router]);

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
