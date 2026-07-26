import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Accueil',
  description: `${BRAND_TAGLINE}. Votre tableau de bord KeyHome — annonces recommandées, favoris et messages.`,
  robots: { index: false, follow: false },
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    title: 'Accueil KeyHome — Votre logement idéal',
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
