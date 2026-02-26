import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accueil — Annonces immobilières',
  description:
    "Explorez les dernières annonces immobilières en Afrique. Maisons, appartements, terrains et villas triés par recommandations personnalisées et dernières publications.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/home',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
