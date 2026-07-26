import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: `CGU KeyHome : règles de publication, système de crédits, Score de Confiance, propriété intellectuelle et responsabilités sur la plateforme immobilière.`,
  robots: { index: true, follow: true },
  alternates: {
    canonical: absoluteUrl('/conditions'),
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation — KeyHome",
    description: `${BRAND_TAGLINE}. CGU de KeyHome : règles de publication, crédits, responsabilités et droits des utilisateurs.`,
    url: absoluteUrl('/conditions'),
    siteName: 'KeyHome',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'KeyHome — CGU',
      },
    ],
  },
};

export default function ConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
