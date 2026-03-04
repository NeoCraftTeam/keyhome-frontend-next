'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useThemeMode } from '@/providers/ThemeProvider';

export type LandingThemeTokens = {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  text: string;
  textSub: string;
  textMuted: string;
  textNav: string;
  navBg: string;
  navBorder: string;
  gridLine: string;
  footerBg: string;
  footerBorder: string;
  quote: string;
  isDark: boolean;
  toggle: () => void;
};

const DARK: Omit<LandingThemeTokens, 'isDark' | 'toggle'> = {
  bg: '#0A0A0F',
  bgAlt: '#0D0D14',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.45)',
  textMuted: 'rgba(255,255,255,0.25)',
  textNav: 'rgba(255,255,255,0.75)',
  navBg: 'rgba(10,10,15,0.88)',
  navBorder: 'rgba(255,255,255,0.06)',
  gridLine: 'rgba(255,255,255,0.02)',
  footerBg: '#07070D',
  footerBorder: 'rgba(255,255,255,0.06)',
  quote: 'rgba(255,255,255,0.65)',
};

const LIGHT: Omit<LandingThemeTokens, 'isDark' | 'toggle'> = {
  bg: '#F5F5FA',
  bgAlt: '#ECEEF6',
  surface: 'rgba(0,0,0,0.03)',
  surfaceHover: 'rgba(0,0,0,0.05)',
  border: 'rgba(0,0,0,0.08)',
  borderHover: 'rgba(0,0,0,0.15)',
  text: '#0F0F16',
  textSub: 'rgba(15,15,22,0.55)',
  textMuted: 'rgba(15,15,22,0.35)',
  textNav: 'rgba(15,15,22,0.75)',
  navBg: 'rgba(245,245,250,0.92)',
  navBorder: 'rgba(0,0,0,0.08)',
  gridLine: 'rgba(0,0,0,0.03)',
  footerBg: '#E5E5EF',
  footerBorder: 'rgba(0,0,0,0.09)',
  quote: 'rgba(15,15,22,0.65)',
};

const LandingThemeContext = createContext<LandingThemeTokens>({
  ...DARK,
  isDark: true,
  toggle: () => {},
});

export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  const tokens = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  return (
    <LandingThemeContext.Provider
      value={{ ...tokens, isDark, toggle: toggleTheme }}
    >
      {children}
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme(): LandingThemeTokens {
  return useContext(LandingThemeContext);
}
