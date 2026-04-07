import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — KeyHome",
  description:
    "Consultez les conditions générales d'utilisation de KeyHome : règles de publication, système de crédits, Score de Confiance, propriété intellectuelle et responsabilités sur notre plateforme immobilière en Afrique.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/conditions',
  },
  openGraph: {
    title: "Conditions Générales d'Utilisation — KeyHome",
    description:
      'CGU de KeyHome : règles de publication, crédits, responsabilités et droits des utilisateurs.',
    url: 'https://keyhome.app/conditions',
    siteName: 'KeyHome',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function ConditionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
