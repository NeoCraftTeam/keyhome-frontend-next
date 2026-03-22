"use client";

import { createTheme } from "@mui/material/styles";
import { baseTheme } from "./theme";
import { brandAgent, light, dark, neutral, semantic } from "./tokens";

/** Owner panel primary: Teal (brandAgent.primary) — vs customer pink (brand.primary) */
export const ownerGradientPrimary = {
  primary: `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`,
  primaryHover: `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`,
  primary135: `linear-gradient(135deg, ${brandAgent.primary}, ${brandAgent.primaryDark})`,
};

export const ownerLightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    primary: {
      main: brandAgent.primary,
      light: brandAgent.primaryLight,
      dark: brandAgent.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: "#222222",
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
          backgroundColor: light.bg,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: `1px solid ${light.border}`,
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
      main: brandAgent.primary,
      light: brandAgent.primaryLight,
      dark: brandAgent.primaryDark,
      contrastText: neutral.white,
    },
    secondary: {
      main: "#E0E0E0",
      light: "#F5F5F5",
      dark: "#B0B0B0",
      contrastText: "#000000",
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
          borderBottom: `1px solid ${dark.border}`,
          boxShadow: "none",
        },
      },
    },
  },
});
