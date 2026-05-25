import { brand, brandAgent, gradient } from '@/theme/tokens';

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

/** Hero teal bailleur. */
const OWNER_HERO_ENCODED = '/images/owner/real-estate-teal.webp';

export const REGISTER_THEME: Record<
  RegisterAccountVisual,
  RegisterThemeTokens
> = {
  customer: {
    visual: 'customer',
    primary: brand.primary,
    primaryDark: brand.primaryDark,
    primaryLight: brand.primaryHover,
    gradient: gradient.primary,
    gradientHover: `linear-gradient(to right, ${brand.primaryHover}, ${brand.primaryActive})`,
    selectedBgAlpha: brand.primaryAlpha10,
    heroSrc: '/images/02Register.webp',
    overlayGradient:
      'linear-gradient(to bottom, rgba(34,34,34,0.15) 0%, rgba(34,34,34,0.62) 100%)',
    tagline: 'Trouvez votre prochain chez-vous',
    formSubtitle: 'Inscrivez-vous pour accéder aux annonces immobilières',
    logoSrc: '/images/logo.png',
  },
  agent: {
    visual: 'agent',
    primary: brandAgent.primary,
    primaryDark: brandAgent.primaryDark,
    primaryLight: brandAgent.primaryLight,
    gradient: `linear-gradient(to right, ${brandAgent.primaryLight}, ${brandAgent.primary})`,
    gradientHover: `linear-gradient(to right, ${brandAgent.primary}, ${brandAgent.primaryDark})`,
    selectedBgAlpha: 'rgba(13,148,136,0.14)',
    heroSrc: OWNER_HERO_ENCODED,
    overlayGradient:
      'linear-gradient(to bottom, rgba(15,118,110,0.28) 0%, rgba(15,23,42,0.78) 100%)',
    tagline: 'Publiez et gérez vos annonces en toute simplicité',
    formSubtitle: 'Inscrivez-vous pour diffuser vos biens sur KeyHome',
    logoSrc: '/images/logo-teal.png',
  },
};

export function getRegisterThemeTokens(
  visual: RegisterAccountVisual
): RegisterThemeTokens {
  return REGISTER_THEME[visual];
}

/** Src du visuel agent (calque hero dédié, inchangé au fil des toggles). */
export const REGISTER_AGENT_HERO_SRC = REGISTER_THEME.agent.heroSrc;
