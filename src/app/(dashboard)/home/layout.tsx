import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accueil — Annonces immobilières vérifiées en Afrique',
  description:
    "Découvrez les meilleures annonces immobilières en Afrique, triées par recommandations personnalisées. Maisons, appartements, terrains et villas — photos réelles, prix transparents, propriétaires vérifiés. Trouvez votre futur logement sur KeyHome.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/home',
  },
  openGraph: {
    title: 'Accueil KeyHome — Votre logement idéal en Afrique',
    description: "Des milliers d'annonces immobilières vérifiées. Recommandations personnalisées, photos réelles, contact direct avec les propriétaires.",
    url: 'https://keyhome.app/home',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
