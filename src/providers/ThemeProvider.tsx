'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/theme/theme';
import MuiEmotionRegistry from '@/components/MuiEmotionRegistry';

export type ThemeChoice = 'light' | 'dark' | 'system';
type ResolvedMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ResolvedMode;
  choice: ThemeChoice;
  toggleTheme: () => void;
  setThemeChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  nonce = '',
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  // Both initializers must return the same value on server AND client first render
  // to avoid hydration mismatch. Real values are read in useEffect after mount.
  const [choice, setChoiceState] = useState<ThemeChoice>('system');
  const [systemDark, setSystemDark] = useState<boolean>(false);

  useEffect(() => {
    // Read saved theme preference after mount
    try {
      const saved = localStorage.getItem('theme') as ThemeChoice | null;
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setChoiceState(saved);
      }
    } catch {
      /* localStorage unavailable */
    }

    // Read and subscribe to system colour-scheme preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent<ThemeChoice>) => {
      if (
        e.detail === 'dark' ||
        e.detail === 'light' ||
        e.detail === 'system'
      ) {
        setChoiceState(e.detail);
      }
    };
    window.addEventListener(
      'theme-change' as never,
      handleThemeChange as EventListener
    );
    return () =>
      window.removeEventListener(
        'theme-change' as never,
        handleThemeChange as EventListener
      );
  }, []);

  const setThemeChoice = useCallback((newChoice: ThemeChoice) => {
    setChoiceState(newChoice);
    try {
      localStorage.setItem('theme', newChoice);
      window.dispatchEvent(
        new CustomEvent('theme-change', { detail: newChoice })
      );
    } catch {
      // ignore
    }
  }, []);

  const resolvedMode: ResolvedMode =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  const toggleTheme = useCallback(() => {
    const next: ThemeChoice = resolvedMode === 'light' ? 'dark' : 'light';
    setThemeChoice(next);
  }, [resolvedMode, setThemeChoice]);
  const theme = resolvedMode === 'light' ? lightTheme : darkTheme;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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

  const value = useMemo(
    () => ({ mode: resolvedMode, choice, toggleTheme, setThemeChoice }),
    [resolvedMode, choice, toggleTheme, setThemeChoice]
  );

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
