'use client';

/**
 * AuthProvider — composer for the authentication context.
 *
 * State ownership lives here. Side-effects are delegated to:
 *  - useClerkSync     → full auth resolution (Clerk exchange + Laravel session)
 *  - use401Listener  → kh:auth-expired window event → session wipe
 *  - useAuthActions  → login, logout, OAuth, refresh (extracted previously)
 */

import { use401Listener } from '@/hooks/auth/use401Listener';
import { useClerkSync } from '@/hooks/auth/useClerkSync';
import { useAuthActions } from '@/hooks/useAuthActions';
import {
  clearAllInMemoryTokens,
  getActiveExpiresAt,
  persistClientToken,
  persistOwnerToken,
} from '@/lib/auth/auth-session';
import { syncChatE2eePublicKeyWithServer } from '@/lib/chat/chat-e2ee-identity';
import { authService, OAuthProvider } from '@/services/auth.service';
import { User, UserRole } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Re-export for tests
export { __resetModuleStateForTests } from '@/lib/auth/auth-session';

/* ── Context type ─────────────────────────────────────────────── */

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
  /** Called by /verify-email, /verify-otp, and WelcomeOverlay after successful auth */
  finalizeAuth: (
    token: string,
    user: User,
    panelSsoUrl: string | null,
    expiresAtMs?: number
  ) => void;
  /** Returns a fresh Clerk session JWT, or null if unavailable */
  getClerkToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ── Provider ─────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // ── Session state ─────────────────────────────────────────────
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authRunRef = useRef(0);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearSession = useCallback(() => {
    queryClient.clear();
    clearAllInMemoryTokens();
    setToken(null);
  }, [queryClient]);

  // ── Sub-hooks ────────────────────────────────────────────────
  useClerkSync(isLoggingOut, {
    setUserState,
    setToken,
    setIsExchanging,
    setHasResolvedInitialAuth,
    clearSession,
    userRef,
  });

  use401Listener(user, setToken, setUserState);

  // ── Auth actions (login / logout / OAuth / refresh) ──────────
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

  // ── Refresh session (token rotation) ─────────────────────────
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { access_token, expires_at } = await authService.refreshToken();
      const expiresAtMs = expires_at
        ? new Date(expires_at).getTime()
        : undefined;
      if (user?.role === UserRole.AGENT) {
        persistOwnerToken(access_token, expiresAtMs);
      } else {
        persistClientToken(access_token, expiresAtMs);
      }
      setToken(access_token);
      return true;
    } catch {
      return false;
    }
  }, [user]);

  // ── Proactive token refresh (AUTH-1) ──────────────────────────
  // Schedule a silent refresh 5 minutes before the stored token expires.
  // Uses a self-chaining ref to avoid including `token` in deps (which caused
  // an infinite loop: setToken → dep change → immediate re-run → setToken …).
  // Math.max(60_000, …) enforces a 60 s minimum gap as a safety net against
  // a misconfigured or very-short-lived expires_at from the backend.
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    scheduleRefreshRef.current = () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (!user) return;
      const expiresAt = getActiveExpiresAt();
      if (!expiresAt) return;
      const ms = Math.max(60_000, expiresAt - Date.now() - 5 * 60 * 1000);
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        refreshSession()
          .then((ok) => {
            if (ok) scheduleRefreshRef.current();
          })
          .catch(() => {});
      }, ms);
    };

    scheduleRefreshRef.current();

    return () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user, refreshSession]);

  // ── Chat E2EE bootstrap (E2EE-1) ────────────────────────────────
  // Ensures the device has an RSA-OAEP keypair registered with the server
  // so peers can wrap a session AES key for this device. Non-blocking — chat
  // falls back to server-encrypted messages if bootstrap fails.
  useEffect(() => {
    if (!user) return;
    void syncChatE2eePublicKeyWithServer(null, user.id);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────
  const isAuthenticated = !!user;
  const isLoading = !hasResolvedInitialAuth || isExchanging;

  // ── Context value ─────────────────────────────────────────────
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

/* ── Consumer hook ────────────────────────────────────────────── */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
