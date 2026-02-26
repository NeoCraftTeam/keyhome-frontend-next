import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rechercher un bien immobilier',
  description:
    "Recherchez parmi des milliers d'annonces immobilières en Afrique. Filtrez par ville, type de bien, budget et superficie. Carte interactive avec géolocalisation.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/search',
  },
  openGraph: {
    title: 'Recherche immobilière — KeyHome',
    description:
      "Trouvez votre logement idéal en Afrique. Recherche avancée avec carte interactive, filtres par ville, prix et superficie.",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
