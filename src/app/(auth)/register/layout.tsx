import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Inscription gratuite — Trouvez votre logement en Afrique',
  description:
    "Créez votre compte KeyHome en 30 secondes, c'est 100% gratuit. Parcourez des milliers d'annonces vérifiées (maisons, appartements, terrains, villas) et contactez directement les propriétaires. Zéro arnaque, zéro intermédiaire.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/register',
  },
  openGraph: {
    title: 'Inscription gratuite — KeyHome, immobilier sans arnaque',
    description: "Rejoignez des milliers d'utilisateurs qui trouvent leur logement en Afrique grâce à KeyHome. Inscription en 30s, annonces vérifiées, contact direct.",
    url: 'https://keyhome.app/register',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
