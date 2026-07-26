import LandingPage from '@/components/landing/LandingPage';
import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';
import { getSiteOrigin } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';
import type { Metadata } from 'next';

const SITE = getSiteOrigin();

const LANDING_DESCRIPTION = `Des milliers d'annonces immobilières vérifiées — maisons, appartements, terrains et villas, partout dans le monde. Recherchez, comparez et contactez directement les propriétaires. ${BRAND_TAGLINE}.`;

export const metadata: Metadata = {
  title: BRAND_TITLE_WITH_TAGLINE,
  description: LANDING_DESCRIPTION,
  keywords: [
    'immobilier',
    'location maison',
    'achat appartement',
    'terrain à vendre',
    'annonces immobilières',
    'propriétaire direct',
    'Cameroun immobilier',
    'Douala',
    'Yaoundé',
    'Abidjan',
    'Cotonou',
    'Lomé',
    'Dakar',
    'KeyHome',
  ],
  openGraph: {
    title: BRAND_TITLE_WITH_TAGLINE,
    description: LANDING_DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/og`,
        width: 1200,
        height: 630,
        alt: BRAND_TITLE_WITH_TAGLINE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE_WITH_TAGLINE,
    description: `Des milliers d'annonces vérifiées — accès coordonnées sécurisé, partout dans le monde. ${BRAND_TAGLINE}.`,
    images: [`${SITE}/og`],
  },
  alternates: {
    canonical: `${SITE}/`,
    languages: buildHreflangAlternates(`${SITE}/`),
  },
};

/**
 * Root page — rendered as a Server Component so that all static marketing
 * content (H1, descriptions, CTA) is present in the initial HTML for SEO.
 *
 * Authenticated users are redirected to /home by the Clerk middleware
 * (src/middleware.ts) at the edge, before this page ever renders.
 */
export default function RootPage() {
  return <LandingPage />;
}
