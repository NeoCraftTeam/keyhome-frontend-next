"use client";

import { createTheme } from "@mui/material/styles";

/** Standard border radius values (small=8, medium=12, large=16, pill=99) */
export const radius = { small: 8, medium: 12, large: 16, pill: 99 } as const;

/** CTA gradient for primary buttons — use theme.palette.gradient.primary */
export const gradientPrimary = {
  primary: "linear-gradient(to right, #F6475F, #D93A50)",
  primaryHover: "linear-gradient(to right, #E03E54, #C53248)",
  primary135: "linear-gradient(135deg, #F6475F, #D93A50)",
};

const baseTheme = {
  typography: {
    // Inter for body, Plus Jakarta Sans for headings
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: "2.25rem",
      lineHeight: 1.15,
      letterSpacing: "-0.04em",
    },
    h2: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      fontSize: "1.75rem",
      lineHeight: 1.2,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: "1.375rem",
      lineHeight: 1.3,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: "1.125rem",
      lineHeight: 1.4,
      letterSpacing: "-0.015em",
    },
    h5: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: "1rem",
      lineHeight: 1.5,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    subtitle1: { fontWeight: 500, fontSize: "1rem", letterSpacing: "-0.005em" },
    subtitle2: { fontWeight: 500, fontSize: "0.875rem" },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: "0.875rem", lineHeight: 1.65 },
    caption: { fontSize: "0.75rem", letterSpacing: "0.01em" },
    button: {
      textTransform: "none" as const,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    overline: { letterSpacing: "0.08em", fontWeight: 600, fontSize: "0.7rem" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: "background-color 0.6s ease, color 0.6s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 24px",
          fontSize: "0.9375rem",
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          fontWeight: 700,
          // Spring-like tap feedback
          transition:
            "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background-color 0.2s ease",
          "&:active": { transform: "scale(0.96)" },
        },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(246, 71, 95, 0.3)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "none",
          border: "1px solid",
          transition:
            "transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 0.25s ease",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            transform: "translateY(-3px)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 600,
          fontSize: "0.75rem",
          transition: "all 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "box-shadow 0.2s ease",
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
          overscrollBehavior: "contain",
        },
        paper: {
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
          scrollbarWidth: "none" as const,
          msOverflowStyle: "none" as const,
          "&::-webkit-scrollbar": {
            display: "none",
            width: 0,
            height: 0,
          },
          "& *": {
            scrollbarWidth: "none" as const,
            msOverflowStyle: "none" as const,
          },
          "& *::-webkit-scrollbar": {
            display: "none",
            width: 0,
            height: 0,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "box-shadow 0.3s ease",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "&:hover": { transform: "scale(1.1)" },
          "&:active": { transform: "scale(0.92)" },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { transition: "color 0.2s ease" },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { transition: "all 0.2s ease" },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
            borderRadius: 4,
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
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
    mode: "light",
    primary: {
      main: "#F6475F",
      light: "#F87080",
      dark: "#D93A50",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#222222",
      light: "#484848",
      dark: "#000000",
      contrastText: "#FFFFFF",
    },
    background: {
      // Slightly warmer off-white — less clinical than pure #F7F7F7
      default: "#F8F7F5",
      paper: "#F8F7F5",
    },
    text: {
      primary: "#1A1A1A",
      secondary: "#717171",
    },
    divider: "rgba(0,0,0,0.07)",
    error: { main: "#C13515" },
    success: { main: "#008A05" },
    grey: {
      50: "#F8F7F5",
      100: "#EFEDEA",
      200: "#E2DFDB",
      300: "#B0B0B0",
      400: "#717171",
      500: "#484848",
      600: "#1A1A1A",
    },
    gradient: {
      primary: "linear-gradient(to right, #F6475F, #D93A50)",
      primaryHover: "linear-gradient(to right, #E03E54, #C53248)",
      primary135: "linear-gradient(135deg, #F6475F, #D93A50)",
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: "rgba(0,0,0,0.07)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#F8F7F5",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#F6475F",
      light: "#F87080",
      dark: "#D93A50",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E0E0E0",
      light: "#F5F5F5",
      dark: "#B0B0B0",
      contrastText: "#000000",
    },
    background: {
      // Deep midnight — not pure black, premium OLED feel
      default: "#0A0A0F",
      paper: "#13131A",
    },
    text: {
      primary: "#F0EEF8",
      secondary: "#9190A4",
    },
    divider: "rgba(255,255,255,0.07)",
    error: { main: "#FF6B6B" },
    success: { main: "#4CAF50" },
    grey: {
      50: "#0A0A0F",
      100: "#13131A",
      200: "#1C1C27",
      300: "#2C2C3E",
      400: "#9190A4",
      500: "#C4C3D4",
      600: "#F0EEF8",
    },
    gradient: {
      primary: "linear-gradient(to right, #F6475F, #D93A50)",
      primaryHover: "linear-gradient(to right, #E03E54, #C53248)",
      primary135: "linear-gradient(135deg, #F6475F, #D93A50)",
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...baseTheme.components?.MuiCard?.styleOverrides?.root,
          borderColor: "rgba(255,255,255,0.07)",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            transform: "translateY(-3px)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
        },
      },
    },
  },
});

declare module "@mui/material/styles" {
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
