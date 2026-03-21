/**
 * Thèmes visuels du flux d'inscription : distinguer clairement particulier (rose) et agent (teal).
 * Images owner : `public/images/owner/` (le dossier `public/image/owner` n'existe pas dans ce repo).
 */
export type RegisterAccountVisual = 'customer' | 'agent';

export type RegisterThemeTokens = {
  visual: RegisterAccountVisual;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
  gradientHover: string;
  selectedBgAlpha: string;
  heroSrc: string;
  overlayGradient: string;
  tagline: string;
  formSubtitle: string;
  logoSrc: string;
};

const CUSTOMER_PRIMARY = '#F6475F';
const CUSTOMER_PRIMARY_DARK = '#D93A50';
const CUSTOMER_PRIMARY_LIGHT = '#E03E54';

const AGENT_PRIMARY = '#0d9488';
const AGENT_PRIMARY_DARK = '#0f766e';
const AGENT_PRIMARY_LIGHT = '#14b8a6';

/** Hero teal (fichier avec espaces — encodé pour Next/Image). */
const OWNER_HERO_ENCODED = '/images/owner/Real%20Estate%20Teal.webp';

export const REGISTER_THEME: Record<RegisterAccountVisual, RegisterThemeTokens> = {
  customer: {
    visual: 'customer',
    primary: CUSTOMER_PRIMARY,
    primaryDark: CUSTOMER_PRIMARY_DARK,
    primaryLight: CUSTOMER_PRIMARY_LIGHT,
    gradient: `linear-gradient(to right, ${CUSTOMER_PRIMARY}, ${CUSTOMER_PRIMARY_DARK})`,
    gradientHover: `linear-gradient(to right, ${CUSTOMER_PRIMARY_LIGHT}, #C53248)`,
    selectedBgAlpha: 'rgba(246,71,95,0.1)',
    heroSrc: '/images/02Register.webp',
    overlayGradient: 'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.62) 100%)',
    tagline: 'Trouvez votre prochain chez-vous',
    formSubtitle: 'Inscrivez-vous pour accéder aux annonces immobilières',
    logoSrc: '/images/logo.png',
  },
  agent: {
    visual: 'agent',
    primary: AGENT_PRIMARY,
    primaryDark: AGENT_PRIMARY_DARK,
    primaryLight: AGENT_PRIMARY_LIGHT,
    gradient: `linear-gradient(to right, ${AGENT_PRIMARY_LIGHT}, ${AGENT_PRIMARY})`,
    gradientHover: `linear-gradient(to right, ${AGENT_PRIMARY}, ${AGENT_PRIMARY_DARK})`,
    selectedBgAlpha: 'rgba(13,148,136,0.14)',
    heroSrc: OWNER_HERO_ENCODED,
    overlayGradient: 'linear-gradient(to bottom, rgba(15,118,110,0.28) 0%, rgba(15,23,42,0.78) 100%)',
    tagline: 'Publiez et gérez vos annonces en toute simplicité',
    formSubtitle: 'Inscrivez-vous pour diffuser vos biens sur KeyHome',
    logoSrc: '/images/logo-teal.png',
  },
};

export function getRegisterThemeTokens(visual: RegisterAccountVisual): RegisterThemeTokens {
  return REGISTER_THEME[visual];
}

/** Src du visuel agent (calque hero dédié, inchangé au fil des toggles). */
export const REGISTER_AGENT_HERO_SRC = REGISTER_THEME.agent.heroSrc;
