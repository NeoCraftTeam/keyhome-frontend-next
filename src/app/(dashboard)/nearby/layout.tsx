import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Annonces à proximité — Logements près de chez vous',
  description: `Localisez les annonces immobilières autour de vous grâce à la géolocalisation. Maisons, appartements et terrains sur une carte interactive en temps réel. ${BRAND_TAGLINE}.`,
  robots: { index: false, follow: false },
  alternates: {
    canonical: absoluteUrl('/nearby'),
    languages: {
      'fr-FR': absoluteUrl('/nearby'),
      'x-default': absoluteUrl('/nearby'),
    },
  },
  openGraph: {
    title: 'Annonces à proximité — KeyHome',
    description: `${BRAND_TAGLINE}. Explorez les logements disponibles autour de vous sur une carte interactive. Géolocalisation en temps réel, filtres par budget et type de bien.`,
    url: absoluteUrl('/nearby'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Annonces à proximité — KeyHome',
      },
    ],
  },
};

export default function NearbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
