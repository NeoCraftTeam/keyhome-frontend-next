'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/theme/theme';
import MuiEmotionRegistry from '@/components/MuiEmotionRegistry';

export type ResolvedMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ResolvedMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribeSystemDark(cb: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function getSystemDarkSnapshot(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return false;
}

export function ThemeProvider({
  children,
  nonce = '',
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );

  const resolvedMode: ResolvedMode = systemDark ? 'dark' : 'light';
  const theme = resolvedMode === 'light' ? lightTheme : darkTheme;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('theme');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-kh-theme', resolvedMode);
    if (resolvedMode === 'dark') {
      document.documentElement.style.backgroundColor =
        theme.palette.background.default;
      document.documentElement.style.color = theme.palette.text.primary;
    } else {
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.color = '';
    }
  }, [
    resolvedMode,
    theme.palette.background.default,
    theme.palette.text.primary,
  ]);

  const value = useMemo(() => ({ mode: resolvedMode }), [resolvedMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiEmotionRegistry nonce={nonce}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div
            suppressHydrationWarning
            style={{
              minHeight: '100vh',
              backgroundColor: theme.palette.background.default,
              color: theme.palette.text.primary,
              transition: mounted
                ? 'background-color 0.6s ease, color 0.6s ease'
                : 'none',
            }}
          >
            {children}
          </div>
        </MuiThemeProvider>
      </MuiEmotionRegistry>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
