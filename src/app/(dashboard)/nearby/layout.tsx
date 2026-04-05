import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Annonces à proximité — Logements près de chez vous',
  description:
    'Localisez les annonces immobilières autour de vous grâce à la géolocalisation. Maisons, appartements et terrains affichés sur une carte interactive en temps réel. Trouvez votre futur logement dans votre quartier avec KeyHome.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/nearby',
  },
  openGraph: {
    title: 'Annonces à proximité — KeyHome',
    description:
      'Explorez les logements disponibles autour de vous sur une carte interactive. Géolocalisation en temps réel, filtres par budget et type de bien.',
    url: 'https://keyhome.app/nearby',
  },
};

export default function NearbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
