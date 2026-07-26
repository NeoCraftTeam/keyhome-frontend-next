import type { Metadata } from 'next';
import SearchLayoutClient from './SearchLayoutClient';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';
import { buildHreflangAlternates } from '@/i18n/routing';

const SITE = getSiteOrigin();

const ITEM_LINKS: Array<{ name: string; path: string }> = [
  {
    name: 'Appartements à Douala',
    path: '/search?city=douala&type=Appartement',
  },
  { name: 'Maisons à Douala', path: '/search?city=douala&type=Maison' },
  {
    name: 'Appartements à Yaoundé',
    path: '/search?city=yaounde&type=Appartement',
  },
  { name: 'Maisons à Yaoundé', path: '/search?city=yaounde&type=Maison' },
  {
    name: 'Appartements à Abidjan',
    path: '/search?city=abidjan&type=Appartement',
  },
  { name: 'Villas à Abidjan', path: '/search?city=abidjan&type=Villa' },
  { name: 'Terrains à Dakar', path: '/search?city=dakar&type=Terrain' },
  { name: 'Bureaux à Abidjan', path: '/search?city=abidjan&type=Bureau' },
  { name: 'Studios à Cotonou', path: '/search?city=cotonou&type=Studio' },
  { name: 'Villas à Dakar', path: '/search?city=dakar&type=Villa' },
];

export const metadata: Metadata = {
  title: 'Rechercher un logement — Carte interactive & filtres avancés',
  description: `Trouvez maisons, appartements, terrains et villas grâce à la recherche intelligente KeyHome. Filtres par ville, budget et superficie. Carte interactive, annonces vérifiées uniquement. ${BRAND_TAGLINE}.`,
  robots: { index: true, follow: true },
  alternates: {
    canonical: absoluteUrl('/search'),
    languages: buildHreflangAlternates(absoluteUrl('/search')),
  },
  openGraph: {
    title: 'Recherche immobilière — KeyHome',
    description: `Carte interactive + filtres par ville, budget et type de bien. Trouvez votre logement parmi des milliers d'annonces vérifiées. ${BRAND_TAGLINE}.`,
    url: absoluteUrl('/search'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Recherche immobilière — KeyHome',
      },
    ],
  },
};

/**
 * Injects static ItemList JSON-LD for top real-estate search queries.
 * The /search page itself is 'use client', so JSON-LD lives here instead.
 */
export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Annonces immobilières — KeyHome',
    description: `Recherchez des appartements, maisons, villas, terrains et bureaux à vendre ou à louer. ${BRAND_TAGLINE}.`,
    url: absoluteUrl('/search'),
    numberOfItems: ITEM_LINKS.length,
    itemListElement: ITEM_LINKS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SearchLayoutClient>{children}</SearchLayoutClient>
    </>
  );
}
