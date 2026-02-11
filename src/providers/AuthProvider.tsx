'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getInitialUser(): User | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('user');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const isLoading = false;
  const router = useRouter();

  const isAuthenticated = !!token && !!user;

  const setUser = useCallback((u: User) => {
    setUserState(u);
    localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login(email, password);
      const newToken = response.token;
      const newUser = response.user;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUserState(newUser);
      router.push('/home');
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silent fail — token may already be invalid
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
      logout,
      setUser,
      refreshUser,
    }),
    [user, token, isLoading, isAuthenticated, login, logout, setUser, refreshUser]
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
