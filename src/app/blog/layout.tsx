import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Blog Immobilier Afrique — Guides, Conseils & Actualités',
  description: `${BRAND_TAGLINE}. Guides pratiques, conseils et actualités sur l'immobilier en Afrique. Prix des loyers, arnaques à éviter, quartiers recommandés à Douala, Abidjan, Cotonou et plus.`,
  alternates: {
    canonical: absoluteUrl('/blog'),
    languages: {
      'fr-FR': absoluteUrl('/blog'),
      'x-default': absoluteUrl('/blog'),
    },
  },
  openGraph: {
    title: 'Blog Immobilier — KeyHome',
    description: `${BRAND_TAGLINE}. Guides et conseils immobiliers pour l'Afrique. Prix, quartiers, arnaques à éviter.`,
    url: absoluteUrl('/blog'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Blog Immobilier — KeyHome',
      },
    ],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
