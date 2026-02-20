'use client';

import { authService, OAuthProvider } from '@/services/auth.service';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore token from sessionStorage and fetch fresh user from API
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');

    if (savedToken) {
      setToken(savedToken);
      // Fetch fresh user data from API instead of reading from storage
      authService.me()
        .then((freshUser) => {
          setUserState(freshUser);
          sessionStorage.setItem('user_id', freshUser.id);
        })
        .catch(() => {
          // Token is invalid/expired — clean up
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user_id');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for forced logout from the API interceptor (e.g. expired token)
  useEffect(() => {
    const handleForcedLogout = () => {
      setToken(null);
      setUserState(null);
      router.replace('/login');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [router]);

  const isAuthenticated = !!token && !!user;

  const setUser = useCallback((u: User) => {
    setUserState(u);
    sessionStorage.setItem('user_id', u.id);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login(email, password);
      const newToken = response.token;
      const newUser = response.user;

      sessionStorage.setItem('token', newToken);
      sessionStorage.setItem('user_id', newUser.id);
      setToken(newToken);
      setUserState(newUser);

      // Small delay to let React flush state before navigation
      await new Promise((resolve) => setTimeout(resolve, 50));
      router.replace('/home');
    },
    [router]
  );

  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      const redirectUrl = await authService.getOAuthRedirectUrl(provider);
      sessionStorage.setItem('oauth_provider', provider);
      window.location.href = redirectUrl;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silent fail — token may already be invalid
    } finally {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_id');
      setToken(null);
      setUserState(null);
      router.push('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.me();
      setUser(freshUser);
    } catch {
      await logout();
    }
  }, [setUser, logout]);

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
    }),
    [user, token, isLoading, isAuthenticated, login, loginWithOAuth, logout, setUser, refreshUser]
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
