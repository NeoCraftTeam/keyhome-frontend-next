import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rechercher un logement — Carte interactive & filtres avancés',
  description:
    "Trouvez votre maison, appartement, terrain ou villa en Afrique grâce à la recherche intelligente de KeyHome. Filtrez par ville (Douala, Abidjan, Cotonou, Lomé…), budget et superficie. Carte interactive pour explorer les quartiers. Annonces vérifiées uniquement.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/search',
  },
  openGraph: {
    title: 'Recherche immobilière — KeyHome',
    description: "Carte interactive + filtres par ville, budget et type de bien. Trouvez votre logement parmi des milliers d'annonces vérifiées en Afrique.",
    url: 'https://keyhome.app/search',
  },
};

/**
 * Injects static ItemList JSON-LD for top real-estate search queries.
 * The /search page itself is 'use client', so JSON-LD lives here instead.
 */
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Annonces immobilières en Afrique — KeyHome',
    description:
      "Recherchez des appartements, maisons, villas, terrains et bureaux à vendre ou à louer en Afrique de l'Ouest.",
    url: 'https://keyhome.app/search',
    numberOfItems: 10,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Appartements à Douala', url: 'https://keyhome.app/search?city=douala&type=Appartement' },
      { '@type': 'ListItem', position: 2, name: 'Maisons à Douala', url: 'https://keyhome.app/search?city=douala&type=Maison' },
      { '@type': 'ListItem', position: 3, name: 'Appartements à Yaoundé', url: 'https://keyhome.app/search?city=yaounde&type=Appartement' },
      { '@type': 'ListItem', position: 4, name: 'Maisons à Yaoundé', url: 'https://keyhome.app/search?city=yaounde&type=Maison' },
      { '@type': 'ListItem', position: 5, name: 'Appartements à Abidjan', url: 'https://keyhome.app/search?city=abidjan&type=Appartement' },
      { '@type': 'ListItem', position: 6, name: 'Villas à Abidjan', url: 'https://keyhome.app/search?city=abidjan&type=Villa' },
      { '@type': 'ListItem', position: 7, name: 'Terrains à Dakar', url: 'https://keyhome.app/search?city=dakar&type=Terrain' },
      { '@type': 'ListItem', position: 8, name: 'Bureaux à Abidjan', url: 'https://keyhome.app/search?city=abidjan&type=Bureau' },
      { '@type': 'ListItem', position: 9, name: 'Studios à Cotonou', url: 'https://keyhome.app/search?city=cotonou&type=Studio' },
      { '@type': 'ListItem', position: 10, name: 'Villas à Dakar', url: 'https://keyhome.app/search?city=dakar&type=Villa' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
