'use client';

import { createTheme } from '@mui/material/styles';
import {
  brand,
  gradient,
  light,
  dark,
  neutral,
  semantic,
  shadow,
} from './tokens';

/** Standard border radius values (small=8, medium=12, large=16, pill=99) */
export const radius = { small: 8, medium: 12, large: 16, pill: 99 } as const;

/** CTA gradient for primary buttons — use theme.palette.gradient.primary */
export const gradientPrimary = {
  primary: gradient.primary,
  primaryHover: gradient.primaryHover,
  primary135: gradient.primary135,
};

export const baseTheme = {
  typography: {
    // Inter for body, Plus Jakarta Sans for headings
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: '2.25rem',
      lineHeight: 1.15,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '1.375rem',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      letterSpacing: '-0.015em',
    },
    h5: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    subtitle1: { fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.65 },
    caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
    button: {
      textTransform: 'none' as const,
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    overline: { letterSpacing: '0.08em', fontWeight: 600, fontSize: '0.7rem' },
  },
  shape: {
    borderRadius: 8, // radius.sm = 8px (standard for buttons/inputs)
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.6s ease, color 0.6s ease',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.sm
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          fontWeight: 700,
          textTransform: 'none' as const,
          // Spring-like tap feedback
          transition:
            'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background-color 0.2s ease',
          '&:active': { transform: 'scale(0.96)' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: shadow.primaryGlow,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // radius.md
          boxShadow: 'none',
          border: '1px solid',
          transition:
            'transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.25s ease',
          '&:hover': {
            boxShadow: shadow.cardHover,
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontSize: '0.75rem',
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
          },
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: false,
      },
      styleOverrides: {
        container: {
          overscrollBehavior: 'contain',
        },
        paper: {
          borderRadius: 20,
          boxShadow: shadow.dialog,
          scrollbarWidth: 'none' as const,
          msOverflowStyle: 'none' as const,
          '&::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0,
          },
          '& *': {
            scrollbarWidth: 'none' as const,
            msOverflowStyle: 'none' as const,
          },
          '& *::-webkit-scrollbar': {
            display: 'none',
            width: 0,
            height: 0,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s ease',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': { transform: 'scale(1.1)' },
          '&:active': { transform: 'scale(0.92)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { transition: 'color 0.2s ease' },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { transition: 'all 0.2s ease' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
            borderRadius: 4,
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: '#222222',
      light: light.grey[500],
      dark: neutral.black,
      contrastText: neutral.white,
    },
    background: {
      // Slightly warmer off-white — less clinical than pure #F7F7F7
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
      primary: gradient.primary,
      primaryHover: gradient.primaryHover,
      primary135: gradient.primary135,
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

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: brand.primary,
      light: brand.primaryLight,
      dark: brand.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: '#E0E0E0',
      light: '#F5F5F5',
      dark: '#B0B0B0',
      contrastText: neutral.black,
    },
    background: {
      // Deep midnight — not pure black, premium OLED feel
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
      primary: gradient.primary,
      primaryHover: gradient.primaryHover,
      primary135: gradient.primary135,
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
            boxShadow: shadow.cardHoverDark,
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: `rgba(10,10,15,0.8)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${dark.border}`,
          boxShadow: 'none',
        },
      },
    },
  },
});

declare module '@mui/material/styles' {
  interface Palette {
    gradient?: {
      primary: string;
      primaryHover: string;
      primary135: string;
    };
  }
  interface PaletteOptions {
    gradient?: {
      primary: string;
      primaryHover: string;
      primary135: string;
    };
  }
}
