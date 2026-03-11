'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { redirectToTrustedUrl } from '@/lib/trusted-redirect';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';
import { useClerk, useAuth as useClerkAuth, useSignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

/** localStorage key for persisting the Sanctum token between page refreshes */
const SANCTUM_TOKEN_KEY = 'kh_sanctum_token';
const LOGOUT_OVERLAY_DURATION_MS = 3500;
const CLERK_SIGN_OUT_FALLBACK_MS = 1200;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  // Guard against stale async callbacks updating state after unmount or re-run
  const authRunRef = useRef(0);

  /** Persist a Sanctum token and register it as the API token getter */
  const activateSanctumToken = useCallback((sanctumToken: string) => {
    localStorage.setItem(SANCTUM_TOKEN_KEY, sanctumToken);
    registerTokenGetter(() => Promise.resolve(sanctumToken));
    setToken(sanctumToken);
  }, []);

  /** Clear any persisted Sanctum token */
  const clearSanctumToken = useCallback(() => {
    localStorage.removeItem(SANCTUM_TOKEN_KEY);
    registerTokenGetter(() => Promise.resolve(null));
    setToken(null);
  }, []);

  // Main auth sync effect — runs when Clerk's load state or sign-in state changes
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // Stamp this run so stale closures from previous runs are ignored
    const runId = ++authRunRef.current;

    // ── Email/password path: no Clerk session ──────────────────────────────
    if (!isSignedIn) {
      const storedToken = localStorage.getItem(SANCTUM_TOKEN_KEY);

      if (storedToken) {
        setIsExchanging(true);
        registerTokenGetter(() => Promise.resolve(storedToken));
        setToken(storedToken);

        authService.me()
          .then((laravelUser) => {
            if (runId !== authRunRef.current) { return; }
            setUserState(laravelUser);
          })
          .catch(() => {
            if (runId !== authRunRef.current) { return; }
            clearSanctumToken();
            setUserState(null);
            router.replace('/login');
          })
          .finally(() => {
            if (runId !== authRunRef.current) { return; }
            setIsExchanging(false);
          });

        return;
      }

      // Truly unauthenticated — reset everything
      clearSanctumToken();
      setUserState(null);
      return;
    }

    // ── OAuth / Clerk path ─────────────────────────────────────────────────
    setIsExchanging(true);
    getToken()
      .then(async (clerkToken) => {
        if (runId !== authRunRef.current || !clerkToken) {
          return;
        }

        // Register Clerk token getter so the Axios interceptor picks it up
        // for the clerkExchange call below
        registerTokenGetter(() => getToken());

        try {
          const result = await authService.clerkExchange(clerkToken);

          if (runId !== authRunRef.current) { return; }

          if ('state' in result && result.state === 'otp_required') {
            sessionStorage.setItem('clerk_auth_email_hint', result.email_hint ?? '');
            router.replace('/verify-otp');
            return;
          }

          const { token: sanctumToken, user: laravelUser, panel_sso_url } = result as {
            token: string;
            user: User;
            panel_sso_url: string | null;
          };

          if (panel_sso_url) {
            if (!redirectToTrustedUrl(panel_sso_url)) {
              clearSanctumToken();
              setUserState(null);
              router.replace('/login');
            }
            return;
          }

          activateSanctumToken(sanctumToken);
          setUserState(laravelUser);
        } catch {
          // clerkExchange failed — do NOT set isAuthenticated, just log out cleanly
          if (runId !== authRunRef.current) { return; }
          clearSanctumToken();
          setUserState(null);
        }
      })
      .finally(() => {
        if (runId !== authRunRef.current) { return; }
        setIsExchanging(false);
      });
  }, [isLoaded, isSignedIn, clerkUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // isAuthenticated requires both a valid token AND a loaded user
  const isAuthenticated = !!token && !!user;
  const isLoading = !isLoaded || isExchanging;

  const setUser = useCallback((u: User) => {
    setUserState(u);
  }, []);

  /** Finalize auth after OTP + profile completion — called by child pages */
  const finalizeAuth = useCallback(
    (sanctumToken: string, laravelUser: User, panelSsoUrl: string | null) => {
      if (panelSsoUrl) {
        if (!redirectToTrustedUrl(panelSsoUrl)) {
          clearSanctumToken();
          setUserState(null);
          router.replace('/login');
        }
        return;
      }

      activateSanctumToken(sanctumToken);
      setUserState(laravelUser);
      sessionStorage.removeItem('clerk_auth_email_hint');
      sessionStorage.removeItem('clerk_auth_prefill');

      // Restore the page the user was on before being bounced to /login
      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else {
        router.replace('/home');
      }
    },
    [activateSanctumToken, clearSanctumToken, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } = await authService.login(email, password);

      if (laravelUser.role !== UserRole.CUSTOMER) {
        throw new Error("Accès réservé aux clients. Utilisez le panneau d'administration.");
      }

      activateSanctumToken(sanctumToken);
      setUserState(laravelUser);

      // Restore the page the user was on before being bounced to /login
      const returnTo = sessionStorage.getItem('kh_redirect_after_login');
      if (returnTo) {
        sessionStorage.removeItem('kh_redirect_after_login');
        router.replace(returnTo);
      } else {
        router.replace('/home');
      }
    },
    [activateSanctumToken, router]
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!signIn) {
        return;
      }

      const strategyMap = {
        google: 'oauth_google',
        facebook: 'oauth_facebook',
        apple: 'oauth_apple',
      } as const;

      // Sign out any existing Clerk session first so the OAuth provider
      // always presents the account selection prompt.
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

  const logout = useCallback(async () => {
    ++authRunRef.current; // Invalidate any in-flight auth callbacks
    setIsLoggingOut(true);

    sessionStorage.removeItem('clerk_auth_email_hint');
    sessionStorage.removeItem('clerk_auth_prefill');
    sessionStorage.removeItem('kh_flw_tx_ref');
    sessionStorage.removeItem('kh_flw_reference');
    sessionStorage.removeItem('kh_just_unlocked');
    sessionStorage.removeItem('kh_redirect_after_login');
    clearSanctumToken();
    setUserState(null);

    await new Promise((resolve) => setTimeout(resolve, LOGOUT_OVERLAY_DURATION_MS));

    if (isSignedIn) {
      try {
        await Promise.race([
          signOut({
            redirectUrl: `${window.location.origin}/home`,
          }),
          new Promise((resolve) => setTimeout(resolve, CLERK_SIGN_OUT_FALLBACK_MS)),
        ]);
      } catch {
        // Fall through to hard redirect fallback.
      }

      window.location.replace('/home');
      return;
    }

    setIsLoggingOut(false);
    router.replace('/home');
  }, [isSignedIn, signOut, clearSanctumToken, router]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUserState(freshUser);
    } catch {
      // Token invalid — clear state without calling logout() to avoid loops
      clearSanctumToken();
      setUserState(null);
      if (isSignedIn) {
        await signOut();
      }
      router.push('/home');
    }
  }, [isSignedIn, signOut, clearSanctumToken, router]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      isLoggingOut,
      login,
      loginWithOAuth,
      logout,
      setUser,
      refreshUser,
      finalizeAuth,
      getClerkToken: getToken,
    }),
    [user, token, isLoading, isAuthenticated, isLoggingOut, login, loginWithOAuth, logout, setUser, refreshUser, finalizeAuth, getToken]
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


