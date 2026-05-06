import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Inscription gratuite — Trouvez votre logement en Afrique',
  description: `${BRAND_TAGLINE}. Créez votre compte KeyHome en 30 secondes, c'est 100% gratuit. Parcourez des milliers d'annonces vérifiées (maisons, appartements, terrains, villas) et contactez directement les propriétaires. Zéro arnaque, zéro intermédiaire.`,
  robots: { index: true, follow: true },
  alternates: {
    canonical: absoluteUrl('/register'),
  },
  openGraph: {
    title: `Inscription gratuite — ${BRAND_NAME}`,
    description: `${BRAND_TAGLINE}. Rejoignez des milliers d'utilisateurs qui trouvent leur logement en Afrique grâce à KeyHome. Inscription en 30s, annonces vérifiées, contact direct.`,
    url: absoluteUrl('/register'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Inscription — KeyHome',
      },
    ],
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
