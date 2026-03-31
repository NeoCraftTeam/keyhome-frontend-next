'use client';

import { createTheme } from '@mui/material/styles';
import { baseTheme } from './theme';
import { brandAgent, light, dark, neutral, semantic, gradient } from './tokens';

/** Owner panel primary: Vibrant teal-to-sky gradient for modern look */
export const ownerGradientPrimary = {
  /** Hero gradient — teal to sky blue (modern, vibrant) */
  primary: gradient.agent,
  primaryHover: gradient.agentHover,
  primary135: gradient.agent,
  /** Horizontal variant for buttons */
  horizontal: gradient.agentHorizontal,
  /** Premium gold variant for special CTAs */
  gold: gradient.agentGold,
};

export const ownerLightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: brandAgent.primary,
      light: brandAgent.primaryLight,
      dark: brandAgent.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: '#222222',
      light: light.grey[500],
      dark: neutral.black,
      contrastText: neutral.white,
    },
    background: {
      default: light.bg,
      paper: light.paper,
    },
    text: {
      primary: light.text,
      secondary: light.textSecondary,
    },
    divider: light.divider,
    error: { main: semantic.error },
    success: { main: semantic.success },
    grey: light.grey,
    gradient: {
      primary: ownerGradientPrimary.primary,
      primaryHover: ownerGradientPrimary.primaryHover,
      primary135: ownerGradientPrimary.primary135,
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: light.divider,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          backgroundColor: brandAgent.primary,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: brandAgent.primaryDark,
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.30)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: light.bg,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${light.border}`,
          boxShadow: 'none',
        },
      },
    },
  },
});

export const ownerDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: brandAgent.primary,
      light: brandAgent.primaryLight,
      dark: brandAgent.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: '#E0E0E0',
      light: '#F5F5F5',
      dark: '#B0B0B0',
      contrastText: '#000000',
    },
    background: {
      default: dark.bg,
      paper: dark.paper,
    },
    text: {
      primary: dark.text,
      secondary: dark.textSecondary,
    },
    divider: dark.divider,
    error: { main: dark.errorBright },
    success: { main: dark.successBright },
    grey: dark.grey,
    gradient: {
      primary: ownerGradientPrimary.primary,
      primaryHover: ownerGradientPrimary.primaryHover,
      primary135: ownerGradientPrimary.primary135,
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: dark.divider,
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          backgroundColor: brandAgent.primary,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: brandAgent.primaryDark,
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.40)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${dark.border}`,
          boxShadow: 'none',
        },
      },
    },
  },
});
