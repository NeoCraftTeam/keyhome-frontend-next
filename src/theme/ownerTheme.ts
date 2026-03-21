"use client";

import { createTheme } from "@mui/material/styles";
import { baseTheme } from "./theme";

/** Owner panel primary: Teal #0D9488 (vs customer pink #F6475F) */
export const ownerGradientPrimary = {
  primary: "linear-gradient(to right, #0D9488, #0F766E)",
  primaryHover: "linear-gradient(to right, #14B8A6, #0D9488)",
  primary135: "linear-gradient(135deg, #0D9488, #0F766E)",
};

export const ownerLightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: "#0D9488",
      light: "#14B8A6",
      dark: "#0F766E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#222222",
      light: "#484848",
      dark: "#000000",
      contrastText: "#FFFFFF",
    },
    background: {
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
          borderColor: "rgba(0,0,0,0.07)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(13, 148, 136, 0.3)",
            transform: "translateY(-1px)",
          },
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

export const ownerDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: {
      main: "#0D9488",
      light: "#14B8A6",
      dark: "#0F766E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E0E0E0",
      light: "#F5F5F5",
      dark: "#B0B0B0",
      contrastText: "#000000",
    },
    background: {
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
          borderColor: "rgba(255,255,255,0.07)",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            transform: "translateY(-3px)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        containedPrimary: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(13, 148, 136, 0.35)",
            transform: "translateY(-1px)",
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
