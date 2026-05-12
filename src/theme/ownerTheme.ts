'use client';

import { createTheme } from '@mui/material/styles';
import { baseTheme } from './theme';
import {
  brandAgent,
  light,
  dark,
  neutral,
  semantic,
  gradient,
  shadow as designShadow,
  transition,
} from './tokens';

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
      main: light.grey[600],
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
          transition: `${transition.polish}`,
          '&:hover': {
            backgroundColor: brandAgent.primaryDark,
            boxShadow: designShadow.ownerContainedHover,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: brandAgent.primary,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: designShadow.ownerAppBar,
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
      main: dark.grey[500],
      light: dark.grey[400],
      dark: dark.grey[300],
      contrastText: neutral.black,
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
          transition: transition.polish,
          '&:hover': {
            boxShadow: designShadow.cardHoverDark,
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
          transition: `${transition.polish}`,
          '&:hover': {
            backgroundColor: brandAgent.primaryDark,
            boxShadow: designShadow.ownerContainedHoverElevated,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: brandAgent.primaryDark,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderBottom: 'none',
          boxShadow: designShadow.ownerAppBarDark,
        },
      },
    },
  },
});
