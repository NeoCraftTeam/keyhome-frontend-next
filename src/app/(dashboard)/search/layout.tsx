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

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
