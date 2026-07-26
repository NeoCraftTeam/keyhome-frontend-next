import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Inscription gratuite — Trouvez votre logement',
  description: `Créez votre compte KeyHome en 30 secondes — 100% gratuit. Parcourez des milliers d'annonces vérifiées (maisons, appartements, terrains, villas), contactez directement les propriétaires. Zéro arnaque, zéro intermédiaire. ${BRAND_TAGLINE}.`,
  robots: { index: false, follow: true },
  alternates: {
    canonical: absoluteUrl('/register'),
  },
  openGraph: {
    title: `Inscription gratuite — ${BRAND_NAME}`,
    description: `Rejoignez des milliers d'utilisateurs qui trouvent leur logement grâce à KeyHome. Inscription en 30s, annonces vérifiées, contact direct. ${BRAND_TAGLINE}.`,
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
