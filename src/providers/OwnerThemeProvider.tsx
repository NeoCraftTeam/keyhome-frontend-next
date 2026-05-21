'use client';

import { ownerDarkTheme, ownerLightTheme } from '@/theme/ownerTheme';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';

// Owner panel has its own theme preference, independent of the client panel.
// This way changing the client panel theme never bleeds into the owner panel.
export type OwnerThemeChoice = 'system' | 'light' | 'dark';
type ResolvedMode = 'light' | 'dark';

const OWNER_CHOICE_KEY = 'kh_owner_theme_choice';
const OWNER_CHOICE_EVENT = 'kh-owner-theme-choice-changed';

interface OwnerThemeContextValue {
  mode: ResolvedMode;
  choice: OwnerThemeChoice;
  setChoice: (choice: OwnerThemeChoice) => void;
}

const OwnerThemeContext = createContext<OwnerThemeContextValue | undefined>(
  undefined
);

function readOwnerChoice(): OwnerThemeChoice {
  if (typeof window === 'undefined') return 'system';
  try {
    const v = localStorage.getItem(OWNER_CHOICE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignore */
  }
  return 'system';
}

function subscribeOwnerChoice(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  window.addEventListener(OWNER_CHOICE_EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(OWNER_CHOICE_EVENT, cb);
  };
}

function subscribeSystemDark(cb: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function OwnerThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const choice = useSyncExternalStore(
    subscribeOwnerChoice,
    readOwnerChoice,
    () => 'system' as OwnerThemeChoice
  );

  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false
  );

  const mode: ResolvedMode =
    choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  const muiTheme = mode === 'dark' ? ownerDarkTheme : ownerLightTheme;

  const setChoice = useCallback((next: OwnerThemeChoice) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OWNER_CHOICE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(OWNER_CHOICE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ mode, choice, setChoice }),
    [mode, choice, setChoice]
  );

  return (
    <OwnerThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        {/*
         * Explicit color + background reset: the root client ThemeProvider wraps
         * the entire app in a <div style={{ color: clientTheme.text.primary }}>.
         * When the client panel is in dark mode but the owner panel is in light
         * mode (or vice-versa) the outer inline color bleeds in and makes text
         * invisible against the owner background.  This div overrides it so
         * every descendant inherits the owner theme's resolved colors.
         */}
        <div
          suppressHydrationWarning
          style={{
            color: muiTheme.palette.text.primary,
            backgroundColor: muiTheme.palette.background.default,
            minHeight: '100vh',
          }}
        >
          {children}
        </div>
      </MuiThemeProvider>
    </OwnerThemeContext.Provider>
  );
}

export function useOwnerTheme(): OwnerThemeContextValue {
  const context = useContext(OwnerThemeContext);
  if (!context) {
    throw new Error('useOwnerTheme must be used within OwnerThemeProvider');
  }
  return context;
}
