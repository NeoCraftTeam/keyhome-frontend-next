'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { useAuthActions } from '@/hooks/useAuthActions';
import {
  clearAllInMemoryTokens,
  clearRoleCookie,
  clearSanctumInMemoryOnly,
  getInMemoryToken,
  hasAnySanctumInMemory,
  migrateLegacyTokens,
  persistOwnerToken,
  persistClientToken,
  persistInMemoryToken,
  registerInMemoryGetter,
  setRoleCookie,
} from '@/lib/auth-session';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService, OAuthProvider } from '@/services/auth.service';
// E2EE bootstrap intentionally not auto-run since mai 2026 — see
// `chat-e2ee-identity.ts` and AGENTS.md (« Chat — désactivation E2EE par défaut »).
// Re-import `syncChatE2eePublicKeyWithServer` here if/when E2EE is turned back on.
import { useQueryClient } from '@tanstack/react-query';
import { User, UserRole } from '@/types';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
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
  login: (
    email: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<void>;
  loginOwner: (
    email: string,
    password: string,
    turnstileToken?: string | null
  ) => Promise<void>;
  loginWithOAuth: (
    provider: OAuthProvider,
    options?: { registrationIntent?: 'customer' | 'agent' }
  ) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  /** Called by /verify-email and /complete-profile after successful auth */
  finalizeAuth: (token: string, user: User, panelSsoUrl: string | null) => void;
  /** Returns a fresh Clerk session JWT, or null if unavailable */
  getClerkToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const pathname = usePathname();
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const authRunRef = useRef(0);
  const pathnameRef = useRef<string | null>(null);
  const clerkExchangeDoneRef = useRef(false);
  const clerkGetTokenRef = useRef(getToken);
  clerkGetTokenRef.current = getToken;

  useLayoutEffect(() => {
    pathnameRef.current = pathname ?? null;
  }, [pathname]);

  // E2EE bootstrap intentionally disabled since mai 2026 for cross-device
  // portability — see AGENTS.md (« Chat — désactivation E2EE par défaut »).
  // The hook below is preserved (commented) so re-enabling sealed messages is
  // a single block of code: uncomment, re-import `syncChatE2eePublicKeyWithServer`
  // / `rtrimPem` and flip `chat.client_sealed_enabled` to true server-side.
  //
  // useEffect(() => {
  //   if (!user?.id || typeof window === 'undefined' || !crypto.subtle) {
  //     return;
  //   }
  //   let cancelled = false;
  //   void (async () => {
  //     try {
  //       const pem = await syncChatE2eePublicKeyWithServer(
  //         user.chat_e2ee_public_key_pem ?? null,
  //         user.id
  //       );
  //       if (cancelled || !pem) {
  //         return;
  //       }
  //       if (rtrimPem(pem) !== rtrimPem(user.chat_e2ee_public_key_pem ?? '')) {
  //         setUserState((prev) =>
  //           prev && prev.id === user.id
  //             ? { ...prev, chat_e2ee_public_key_pem: pem }
  //             : prev
  //         );
  //       }
  //     } catch {
  //       /* E2EE bootstrap is optional — never block session */
  //     }
  //   })();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [user?.id, user?.chat_e2ee_public_key_pem]);

  /* ── Session helpers ──────────────────────────────────────────── */

  const persistSession = useCallback((sanctumToken: string) => {
    persistInMemoryToken(sanctumToken);
    setToken(sanctumToken);
  }, []);

  const clearSession = useCallback(() => {
    queryClient.clear();
    clearAllInMemoryTokens();
    setToken(null);
  }, [queryClient]);

  /* ── Initial auth resolution ──────────────────────────────────── */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // During logout overlay, do not resolve /auth/me or Clerk exchange — otherwise
    // a still-valid Laravel cookie or Clerk session can re-authenticate before redirect.
    if (isLoggingOut) {
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

    // If the user already has a valid Sanctum session (passkey / email-password login),
    // skip the Clerk exchange entirely. A stale Clerk session must never override a
    // freshly established passkey or password session — doing so would redirect the
    // owner to /home when they log in via passkey while a client Clerk session is active.
    if (hasAnySanctumInMemory()) {
      clerkExchangeDoneRef.current = true;
      setIsExchanging(false);
      setHasResolvedInitialAuth(true);
      return;
    }

    setIsExchanging(true);

    void (async () => {
      let clerkToken: string | null = null;
      try {
        clerkToken = await clerkGetTokenRef.current();
      } catch {
        setIsExchanging(false);
        setHasResolvedInitialAuth(true);
        return;
      }

      try {
        if (runId !== authRunRef.current) {
          return;
        }

        // Read intent BEFORE the try-catch so it's accessible in the catch handler.
        const intentRaw =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('kh_registration_intent')
            : null;

        if (!clerkToken) {
          // Clerk session exists but token is unavailable (expired / refresh failed).
          // Redirect to the appropriate login so the user can retry.
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

          const skipPanelSsoForIntegratedOwner =
            laravelUser.role === UserRole.AGENT;
          const panelUrl = skipPanelSsoForIntegratedOwner
            ? null
            : panel_sso_url;

          if (panelUrl) {
            if (!redirectToTrustedUrl(panelUrl)) {
              clearSession();
              setUserState(null);
              router.replace('/login');
            }

            return;
          }

          // ── Context isolation ──────────────────────────────────────────────
          // Prevents a Clerk session from one tab’s role-context leaking into
          // another tab. An owner’s Google account must not auto-authenticate a
          // customer tab, and vice versa — making true dual-tab usage work.
          // intentRaw was captured before the API call and holds the stored intent.
          const path = pathnameRef.current ?? '';
          const expectedOwnerContext =
            path.startsWith('/owner') || intentRaw === 'agent';
          const isOwnerRole =
            laravelUser.role === UserRole.AGENT ||
            laravelUser.role === UserRole.ADMIN;

          if (isOwnerRole && !expectedOwnerContext) {
            // Owner account detected without an explicit owner-context intent
            // (e.g. the user clicked Google from a customer page, or intent was
            // lost). Authenticate them properly and route to their owner space.
            persistOwnerToken(sanctumToken);
            setToken(sanctumToken);
            setUserState(laravelUser);
            setRoleCookie(laravelUser.role ?? UserRole.AGENT);
            router.replace('/owner/dashboard');
            return;
          }

          if (!isOwnerRole && path.startsWith('/owner')) {
            // Customer Clerk session on an owner tab — redirect to home.
            clearSanctumInMemoryOnly();
            setUserState(null);
            clearRoleCookie();
            router.replace('/home');
            return;
          }
          // ─────────────────────────────────────────────────────────────────────

          // Role-aware persistence — agent token must live in ownerInMemoryToken
          // from the start so getActiveToken() returns the right slot.
          if (isOwnerRole) {
            persistOwnerToken(sanctumToken);
          } else {
            persistClientToken(sanctumToken);
          }
          setToken(sanctumToken);
          setUserState(laravelUser);
          setRoleCookie(laravelUser.role ?? UserRole.CUSTOMER);

          if (isOwnerRole) {
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
          // Redirect to the appropriate login so the user is not silently stuck
          // on /sso-callback (or wherever clerkExchange was triggered from).
          const failPath = pathnameRef.current ?? '';
          const failIsOwner =
            failPath.startsWith('/owner') || intentRaw === 'agent';
          router.replace(failIsOwner ? '/owner/login' : '/login');
        }
      } finally {
        if (runId !== authRunRef.current) {
          return;
        }
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
  ]);

  const isAuthenticated = !!user;
  const isLoading = !isLoaded || !hasResolvedInitialAuth || isExchanging;

  /* ── 401 listener ─────────────────────────────────────────────── */

  useEffect(() => {
    const handleAuthExpired = () => {
      if (!user) {
        return;
      }
      // clearAllInMemoryTokens() internally calls registerTokenGetter(() => null)
      // AND removes the sessionStorage backup keys so a page refresh can't
      // rehydrate a stale token and silently re-authenticate the user.
      clearAllInMemoryTokens();
      queryClient.clear();
      setToken(null);
      setUserState(null);
      clearRoleCookie();
    };
    window.addEventListener('kh:auth-expired', handleAuthExpired);
    return () =>
      window.removeEventListener('kh:auth-expired', handleAuthExpired);
  }, [user, queryClient]);

  /* ── Auth actions (extracted to useAuthActions) ──────────────── */

  const {
    login,
    loginOwner,
    loginWithOAuth,
    logout,
    refreshUser,
    setUser,
    finalizeAuth,
    getClerkToken,
  } = useAuthActions({
    setUserState,
    setToken,
    setIsLoggingOut,
    clearSession,
    authRunRef,
  });

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { access_token } = await authService.refreshToken();

      const isOwnerRole =
        user?.role === UserRole.AGENT || user?.role === UserRole.ADMIN;
      if (isOwnerRole) {
        persistOwnerToken(access_token);
      } else {
        persistClientToken(access_token);
      }

      setToken(access_token);

      return true;
    } catch {
      return false;
    }
  }, [user?.role]);

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
      refreshSession,
      finalizeAuth,
      getClerkToken,
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
      refreshSession,
      finalizeAuth,
      getClerkToken,
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
