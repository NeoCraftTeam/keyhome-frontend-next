'use client';

import { registerTokenGetter } from '@/lib/auth-token';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';
import { useAuth as useClerkAuth, useClerk, useSignIn, useUser } from '@clerk/nextjs';
import type { OAuthStrategy } from '@clerk/types';
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  /** Called by /verify-email and /complete-profile after successful auth */
  finalizeAuth: (token: string, user: User, panelSsoUrl: string | null) => void;
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
          const result = await authService.clerkExchange();

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
            window.location.href = panel_sso_url;
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
        window.location.href = panelSsoUrl;
        return;
      }

      activateSanctumToken(sanctumToken);
      setUserState(laravelUser);
      sessionStorage.removeItem('clerk_auth_email_hint');
      sessionStorage.removeItem('clerk_auth_prefill');
      router.replace('/home');
    },
    [activateSanctumToken, router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: sanctumToken, user: laravelUser } = await authService.login(email, password);

      if (laravelUser.role !== UserRole.CUSTOMER) {
        throw new Error("Accès réservé aux clients. Utilisez le panneau d'administration.");
      }

      activateSanctumToken(sanctumToken);
      setUserState(laravelUser);
      router.replace('/home');
    },
    [activateSanctumToken, router]
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!signIn) {
        return;
      }

      const strategyMap: Record<OAuthProvider, OAuthStrategy> = {
        google: 'oauth_google',
        facebook: 'oauth_facebook',
        apple: 'oauth_apple',
      };

      await signIn.authenticateWithRedirect({
        strategy: strategyMap[provider],
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: '/home',
        ...(provider === 'google' ? { qs: { prompt: 'select_account' } } : {}),
      });
    },
    [signIn]
  );

  const logout = useCallback(async () => {
    ++authRunRef.current; // Invalidate any in-flight auth callbacks
    sessionStorage.removeItem('clerk_auth_email_hint');
    sessionStorage.removeItem('clerk_auth_prefill');
    clearSanctumToken();
    setUserState(null);

    if (isSignedIn) {
      await signOut();
    }

    router.push('/login');
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
      router.push('/login');
    }
  }, [isSignedIn, signOut, clearSanctumToken, router]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      loginWithOAuth,
      logout,
      setUser,
      refreshUser,
      finalizeAuth,
    }),
    [user, token, isLoading, isAuthenticated, login, loginWithOAuth, logout, setUser, refreshUser, finalizeAuth]
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


