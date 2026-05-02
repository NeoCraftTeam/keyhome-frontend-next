'use client';

import { createContext, useContext, type ReactNode } from 'react';

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
};

const DARK: Omit<LandingThemeTokens, 'isDark'> = {
  bg: '#0A0A0F',
  bgAlt: '#0D0D14',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.55)',
  textNav: 'rgba(255,255,255,0.75)',
  navBg: 'rgba(10,10,15,0.88)',
  navBorder: 'rgba(255,255,255,0.06)',
  gridLine: 'rgba(255,255,255,0.02)',
  footerBg: '#07070D',
  footerBorder: 'rgba(255,255,255,0.06)',
  quote: 'rgba(255,255,255,0.65)',
};

const LandingThemeContext = createContext<LandingThemeTokens>({
  ...DARK,
  isDark: true,
});

/**
 * Landing (/) uses a dedicated dark marketing palette regardless of OS theme.
 * The rest of the app follows `prefers-color-scheme` via `ThemeProvider`.
 */
export function LandingThemeProvider({ children }: { children: ReactNode }) {
  return (
    <LandingThemeContext.Provider value={{ ...DARK, isDark: true }}>
      {children}
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme(): LandingThemeTokens {
  return useContext(LandingThemeContext);
}
