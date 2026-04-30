export interface ChatTheme {
  accent: string;
  accentHover: string;
  accentLight: string;
  accentLighter: string;
  /** Second gradient stop for own-message bubbles */
  bubbleGradientEnd: string;
  /** Subtle bg tint for the message area */
  chatBg: string;
  /** Glass border for header / input bar */
  glassBorder: string;
  /** Active conversation row background */
  activeBg: string;
  /** Skeleton shimmer highlight */
  shimmer: string;
  /** Read-receipt tick color (WhatsApp-style) */
  readTick: string;
  // ── Dark-mode surface tokens ──────────────────────────────────────────────
  /** true when this is a dark variant */
  isDark: boolean;
  /** Conversation list / sidebar background */
  listBg: string;
  /** Received message bubble background */
  surfaceBg: string;
  /** Received message bubble text */
  surfaceText: string;
  /** Primary text (names, body) */
  textPrimary: string;
  /** Secondary text (preview snippet, labels) */
  textSecondary: string;
  /** Muted text (timestamps, placeholders) */
  textMuted: string;
  /** Textarea / search field background */
  inputBg: string;
  /** Logo used as blurred watermark in the chat area */
  logoSrc: string;
  /** true when this theme is used inside the owner/agent panel */
  isOwnerPanel: boolean;
}

export const CLIENT_THEME: ChatTheme = {
  accent: '#F6475F',
  accentHover: '#e03050',
  accentLight: 'rgba(246,71,95,0.10)',
  accentLighter: 'rgba(246,71,95,0.04)',
  bubbleGradientEnd: '#C9273E',
  chatBg: '#fdf6f7',
  glassBorder: 'rgba(246,71,95,0.12)',
  activeBg: 'rgba(246,71,95,0.07)',
  shimmer: 'rgba(246,71,95,0.06)',
  readTick: '#F6475F',
  isDark: false,
  listBg: '#ffffff',
  surfaceBg: '#ffffff',
  surfaceText: '#1f2937',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  inputBg: '#f8f9fa',
  logoSrc: '/images/logo.png',
  isOwnerPanel: false,
};

/** Dark variant — same pink accent, slate surfaces */
export const CLIENT_DARK_THEME: ChatTheme = {
  accent: '#F6475F',
  accentHover: '#e03050',
  accentLight: 'rgba(246,71,95,0.15)',
  accentLighter: 'rgba(246,71,95,0.08)',
  bubbleGradientEnd: '#C9273E',
  chatBg: '#0f172a',
  glassBorder: 'rgba(246,71,95,0.18)',
  activeBg: 'rgba(246,71,95,0.14)',
  shimmer: 'rgba(246,71,95,0.10)',
  readTick: '#F6475F',
  isDark: true,
  listBg: '#1e293b',
  surfaceBg: '#334155',
  surfaceText: '#f1f5f9',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  inputBg: 'rgba(255,255,255,0.07)',
  logoSrc: '/images/logo.png',
  isOwnerPanel: false,
};

export const OWNER_THEME: ChatTheme = {
  accent: '#0D9488',
  accentHover: '#0b7a72',
  accentLight: 'rgba(13,148,136,0.10)',
  accentLighter: 'rgba(13,148,136,0.04)',
  bubbleGradientEnd: '#087a70',
  chatBg: '#f4faf9',
  glassBorder: 'rgba(13,148,136,0.12)',
  activeBg: 'rgba(13,148,136,0.07)',
  shimmer: 'rgba(13,148,136,0.06)',
  readTick: '#0D9488',
  isDark: false,
  listBg: '#ffffff',
  surfaceBg: '#ffffff',
  surfaceText: '#1f2937',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  inputBg: '#f8f9fa',
  logoSrc: '/images/logo-teal.png',
  isOwnerPanel: true,
};

/** Dark variant — teal accent, slate surfaces */
export const OWNER_DARK_THEME: ChatTheme = {
  accent: '#0D9488',
  accentHover: '#0b7a72',
  accentLight: 'rgba(13,148,136,0.15)',
  accentLighter: 'rgba(13,148,136,0.08)',
  bubbleGradientEnd: '#087a70',
  chatBg: '#0f172a',
  glassBorder: 'rgba(13,148,136,0.20)',
  activeBg: 'rgba(13,148,136,0.14)',
  shimmer: 'rgba(13,148,136,0.10)',
  readTick: '#0D9488',
  isDark: true,
  listBg: '#1e293b',
  surfaceBg: '#334155',
  surfaceText: '#f1f5f9',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  inputBg: 'rgba(255,255,255,0.07)',
  logoSrc: '/images/logo-teal.png',
  isOwnerPanel: true,
};
