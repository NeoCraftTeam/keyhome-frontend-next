'use client';

import { createContext, useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { ownerLightTheme, ownerDarkTheme } from '@/theme/ownerTheme';
import { useThemeMode } from '@/providers/ThemeProvider';

// Owner panel resolves light/dark MUI palettes from global ThemeProvider mode,
// which tracks `prefers-color-scheme` only. Landing (/) uses separate tokens.
type ResolvedMode = 'light' | 'dark';

const OwnerThemeContext = createContext<{ mode: ResolvedMode } | undefined>(
  undefined
);

export function OwnerThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode } = useThemeMode();
  const muiTheme = mode === 'dark' ? ownerDarkTheme : ownerLightTheme;

  const value = useMemo(() => ({ mode }), [mode]);

  return (
    <OwnerThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
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
