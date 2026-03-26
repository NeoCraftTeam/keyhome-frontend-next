/**
 * Centralized design tokens for the KeyHome design system.
 * All colors, gradients, and semantic values used across the app
 * should be imported from here — never hardcoded in components.
 */

/* ── Brand Colors ────────────────────────────────────────────── */

export const brand = {
  primary: '#F6475F',
  primaryLight: '#F87080',
  primaryDark: '#D93A50',
  primaryHover: '#E03E54',
  primaryActive: '#C53248',
  /** rgba alias for overlays / alpha backgrounds */
  primaryAlpha10: 'rgba(246,71,95,0.1)',
  primaryAlpha5: 'rgba(246,71,95,0.05)',
  primaryAlpha30: 'rgba(246,71,95,0.3)',
} as const;

export const brandAgent = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#14B8A6',
} as const;

/* ── Gradients ───────────────────────────────────────────────── */

export const gradient = {
  primary: `linear-gradient(to right, ${brand.primary}, ${brand.primaryDark})`,
  primaryHover: `linear-gradient(to right, ${brand.primaryHover}, ${brand.primaryActive})`,
  primary135: `linear-gradient(135deg, ${brand.primary}, ${brand.primaryDark})`,
  /** 135deg with explicit stops (used in some landing / survey pages) */
  primary135Stops: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
  /** Deep transition gradient — page-level overlays/loaders */
  pageTransition: `linear-gradient(135deg, ${brand.primary} 0%, #C0302A 100%)`,
} as const;

/* ── Semantic Colors ─────────────────────────────────────────── */

export const semantic = {
  success: '#008A05',
  successMui: '#2E7D32',
  successBright: '#10B981',
  error: '#C13515',
  errorBright: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  whatsapp: '#25D366',
  purple: '#8B5CF6',
} as const;

/* ── Light theme palette ─────────────────────────────────────── */

export const light = {
  bg: '#F8F7F5',
  paper: '#F8F7F5',
  text: '#1A1A1A',
  textSecondary: '#5A5A5A', // WCAG AA compliant: 5.1:1 contrast ratio (was #717171 at 4.18:1)
  divider: 'rgba(0,0,0,0.07)',
  border: 'rgba(0,0,0,0.06)',
  grey: {
    50: '#F8F7F5',
    100: '#EFEDEA',
    200: '#E2DFDB',
    300: '#B0B0B0',
    400: '#5A5A5A', // Updated to match textSecondary
    500: '#484848',
    600: '#1A1A1A',
  },
} as const;

/* ── Dark theme palette ──────────────────────────────────────── */

export const dark = {
  bg: '#0A0A0F',
  paper: '#13131A',
  surface: '#1C1C27',
  text: '#F0EEF8',
  textSecondary: '#9190A4',
  divider: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.06)',
  grey: {
    50: '#0A0A0F',
    100: '#13131A',
    200: '#1C1C27',
    300: '#2C2C3E',
    400: '#9190A4',
    500: '#C4C3D4',
    600: '#F0EEF8',
  },
  errorBright: '#FF6B6B',
  successBright: '#4CAF50',
} as const;

/* ── Neutral helpers ─────────────────────────────────────────── */

export const neutral = {
  white: '#FFFFFF',
  black: '#000000',
  slate400: '#94A3B8',
} as const;
