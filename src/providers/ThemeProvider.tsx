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

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') {
        setMode(saved);
      }
    } catch {
      // localStorage may be unavailable
    }
    const handleThemeChange = (e: CustomEvent<ThemeMode>) => {
      if (e.detail === 'dark' || e.detail === 'light') setMode(e.detail);
    };
    window.addEventListener('theme-change' as never, handleThemeChange as EventListener);
    return () => window.removeEventListener('theme-change' as never, handleThemeChange as EventListener);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', next);
        window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const theme = mode === 'light' ? lightTheme : darkTheme;

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: 'background-color 0.6s ease, color 0.6s ease',
          }}
        >
          {children}
        </div>
      </MuiThemeProvider>
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
