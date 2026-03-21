'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { ownerLightTheme, ownerDarkTheme } from '@/theme/ownerTheme';
import { useThemeMode } from '@/providers/ThemeProvider';

type ResolvedMode = 'light' | 'dark';

const OwnerThemeContext = createContext<{ mode: ResolvedMode } | undefined>(undefined);

export function OwnerThemeProvider({ children }: { children: React.ReactNode }) {
  const { choice, mode } = useThemeMode();
  const theme = mode === 'dark' ? ownerDarkTheme : ownerLightTheme;

  const value = useMemo(() => ({ mode }), [mode]);

  return (
    <OwnerThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </OwnerThemeContext.Provider>
  );
}

export function useOwnerTheme() {
  const context = useContext(OwnerThemeContext);
  if (!context) {
    throw new Error('useOwnerTheme must be used within OwnerThemeProvider');
  }
  return context;
}
