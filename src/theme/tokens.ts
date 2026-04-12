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
  /** rgba aliases for overlays / alpha backgrounds */
  primaryAlpha5: 'rgba(246,71,95,0.05)',
  primaryAlpha10: 'rgba(246,71,95,0.1)',
  primaryAlpha12: 'rgba(246,71,95,0.12)',
  primaryAlpha15: 'rgba(246,71,95,0.15)',
  primaryAlpha25: 'rgba(246,71,95,0.25)',
  primaryAlpha30: 'rgba(246,71,95,0.3)',
  primaryAlpha40: 'rgba(246,71,95,0.4)',
  primaryAlpha88: 'rgba(246,71,95,0.88)',
} as const;

export const brandAgent = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#14B8A6',
  /** Accent gold — premium, luxury feel */
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FBBF24',
  /** Secondary sky blue for gradients */
  secondary: '#0EA5E9',
  secondaryDark: '#0284C7',
  /** Alpha variants for overlays */
  primaryAlpha10: 'rgba(13,148,136,0.1)',
  primaryAlpha20: 'rgba(13,148,136,0.2)',
  accentAlpha10: 'rgba(245,158,11,0.1)',
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
  /** Agent/Owner — teal to sky blue (modern, vibrant) */
  agent: `linear-gradient(135deg, #0D9488 0%, #0EA5E9 100%)`,
  agentHover: `linear-gradient(135deg, #0F766E 0%, #0284C7 100%)`,
  /** Agent — teal to gold (premium, luxury) */
  agentGold: `linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)`,
  /** Agent — horizontal variant */
  agentHorizontal: `linear-gradient(to right, #0D9488, #0EA5E9)`,
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
  bg: '#141419',
  paper: '#1D1D24',
  surface: '#24242D',
  text: '#F0EEF8',
  textSecondary: '#9190A4',
  divider: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.06)',
  grey: {
    50: '#141419',
    100: '#1D1D24',
    200: '#24242D',
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

/* ── Border Radius ───────────────────────────────────────────── */

export const radius = {
  xs: 4, // 4px  — chips, badges
  sm: 8, // 8px  — buttons, inputs
  md: 12, // 12px — cards
  lg: 16, // 16px — panels
  xl: 24, // 24px — sheets, dialogs
  full: 9999,
} as const;

/* ── Shadows ─────────────────────────────────────────────────── */

export const shadow = {
  /** Subtle card resting shadow — elevation 1 */
  card: '0 1px 4px rgba(0,0,0,0.08)',
  /** Card hover lift — elevation 2 (light mode) */
  cardHover: '0 8px 32px rgba(0,0,0,0.06)',
  /** Card hover lift — elevation 2 (dark mode) */
  cardHoverDark: '0 8px 32px rgba(0,0,0,0.4)',
  /** Small intra-card shadow (image nav buttons, badges) */
  cardSm: '0 1px 4px rgba(0,0,0,0.15)',
  /** Medium surface shadow (sticky bars, floating elements) */
  medium: '0 2px 8px rgba(0,0,0,0.1)',
  /** Elevated modal / dropdown shadow — elevation 3 */
  modal: '0 8px 32px rgba(0,0,0,0.14)',
  /** Dialog / sheet — elevation 4 */
  dialog: '0 25px 60px rgba(0,0,0,0.15)',
  /** Primary-tinted glow for CTAs (full) */
  primaryGlow: '0 8px 20px rgba(246,71,95,0.25)',
  /** Soft primary glow for hover states */
  primaryGlowSm: '0 4px 12px rgba(246,71,95,0.18)',
  /** Agent/teal glow for owner CTAs */
  agentGlow: '0 8px 20px rgba(13,148,136,0.25)',
  /** Smaller agent glow */
  agentGlowSm: '0 4px 12px rgba(13,148,136,0.18)',
  /** Focus ring — primary (red) */
  focusRing: '0 0 0 4px rgba(246,71,95,0.10)',
  /** Focus ring — agent/teal */
  agentFocusRing: '0 0 0 4px rgba(13,148,136,0.12)',
  /** Focus ring — success/green */
  successRing: '0 0 0 4px rgba(0,138,5,0.10)',
  /** Focus ring — error/red */
  errorRing: '0 0 0 4px rgba(193,53,21,0.10)',
} as const;

/* ── Spacing scale (in px — use as MUI sx numeric values / 8) ── */

export const spacing = {
  xs: 0.5, // 4px
  sm: 1, // 8px
  md: 2, // 16px
  lg: 3, // 24px
  xl: 4, // 32px
  '2xl': 6, // 48px
  '3xl': 8, // 64px
} as const;

/* ── Animation / transition presets ─────────────────────────── */

export const transition = {
  /** Standard UI interaction speed */
  fast: 'all 0.15s ease',
  /** Page & card reveal speed */
  base: 'all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** Smooth, spring-like transitions */
  spring: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
