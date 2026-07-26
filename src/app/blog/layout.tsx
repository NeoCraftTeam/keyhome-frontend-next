import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Blog immobilier Afrique — Guides, conseils & actualités',
  description: `Guides pratiques, conseils et actualités sur l'immobilier. Prix des loyers, arnaques à éviter, quartiers recommandés à Douala, Abidjan, Cotonou et plus. ${BRAND_TAGLINE}.`,
  alternates: {
    canonical: absoluteUrl('/blog'),
    languages: buildHreflangAlternates(absoluteUrl('/blog')),
  },
  openGraph: {
    title: 'Blog Immobilier — KeyHome',
    description: `${BRAND_TAGLINE}. Guides et conseils immobiliers pour l'Afrique. Prix, quartiers, arnaques à éviter.`,
    url: absoluteUrl('/blog'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/og?title=${encodeURIComponent('Blog immobilier Afrique')}&subtitle=${encodeURIComponent('Guides, conseils & actualités')}`,
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
