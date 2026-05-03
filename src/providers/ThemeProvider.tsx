'use client';

import {
  createContext,
  useCallback,
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

export type ThemeChoice = 'system' | 'light' | 'dark';

const CHOICE_KEY = 'kh_theme_choice';
const CHOICE_EVENT = 'kh-theme-choice-changed';

interface ThemeContextType {
  mode: ResolvedMode;
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredChoice(): ThemeChoice {
  if (typeof window === 'undefined') {
    return 'system';
  }
  try {
    const v = localStorage.getItem(CHOICE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return 'system';
}

function subscribeChoice(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = (): void => {
    onStoreChange();
  };
  window.addEventListener('storage', handler);
  window.addEventListener(CHOICE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(CHOICE_EVENT, handler);
  };
}

function getChoiceSnapshot(): ThemeChoice {
  return readStoredChoice();
}

function getChoiceServerSnapshot(): ThemeChoice {
  return 'system';
}

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

  const choice = useSyncExternalStore(
    subscribeChoice,
    getChoiceSnapshot,
    getChoiceServerSnapshot
  );

  const setChoice = useCallback((next: ThemeChoice) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(CHOICE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(CHOICE_EVENT));
  }, []);

  const resolvedMode: ResolvedMode =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

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
    () => ({ mode: resolvedMode, choice, setChoice }),
    [resolvedMode, choice, setChoice]
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
