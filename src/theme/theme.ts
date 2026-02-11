'use client';

import { createTheme } from '@mui/material/styles';

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 },
    h3: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
    h4: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
    h6: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontWeight: 500, fontSize: '1rem' },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': { transform: 'scale(0.97)' },
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(246, 71, 95, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: '1px solid',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(246, 71, 95, 0.12)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
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
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'scale(1.08)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'color 0.2s ease',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
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
      main: '#F6475F',
      light: '#F87080',
      dark: '#D93A50',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#222222',
      light: '#484848',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7F7F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#222222',
      secondary: '#717171',
    },
    divider: '#EBEBEB',
    error: {
      main: '#C13515',
    },
    success: {
      main: '#008A05',
    },
    grey: {
      50: '#F7F7F7',
      100: '#EBEBEB',
      200: '#DDDDDD',
      300: '#B0B0B0',
      400: '#717171',
      500: '#484848',
      600: '#222222',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: '#EBEBEB',
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
      main: '#F6475F',
      light: '#F87080',
      dark: '#D93A50',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E0E0E0',
      light: '#F5F5F5',
      dark: '#B0B0B0',
      contrastText: '#000000',
    },
    background: {
      default: '#1A1A1A',
      paper: '#262626',
    },
    text: {
      primary: '#F7F7F7',
      secondary: '#B0B0B0',
    },
    divider: '#333333',
    error: {
      main: '#FF6B6B',
    },
    success: {
      main: '#4CAF50',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: '#333333',
        },
      },
    },
  },
});
