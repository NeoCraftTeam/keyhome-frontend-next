import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Annonces immobilières près de vous',
  description:
    "Découvrez les annonces immobilières proches de votre position. Carte interactive, filtres par type de bien et budget. Trouvez votre logement à proximité.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/nearby',
  },
};

export default function NearbyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
