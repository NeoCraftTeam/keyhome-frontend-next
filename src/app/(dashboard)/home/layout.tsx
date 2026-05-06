import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Accueil — Annonces immobilières vérifiées en Afrique',
  description: `${BRAND_TAGLINE}. Découvrez les meilleures annonces immobilières en Afrique, triées par recommandations personnalisées. Maisons, appartements, terrains et villas — photos réelles, prix transparents, propriétaires vérifiés. Trouvez votre futur logement sur KeyHome.`,
  robots: { index: true, follow: true },
  alternates: {
    canonical: absoluteUrl('/home'),
    languages: {
      'fr-FR': absoluteUrl('/home'),
      'x-default': absoluteUrl('/home'),
    },
  },
  openGraph: {
    title: 'Accueil KeyHome — Votre logement idéal en Afrique',
    description: `${BRAND_TAGLINE}. Des milliers d'annonces immobilières vérifiées. Recommandations personnalisées, photos réelles, contact direct avec les propriétaires.`,
    url: absoluteUrl('/home'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Accueil KeyHome',
      },
    ],
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
