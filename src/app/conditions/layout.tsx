import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — KeyHome",
  description:
    "Consultez les conditions générales d'utilisation de KeyHome : règles de publication des annonces, politique de paiement et de remboursement, protection des données, responsabilités et droits des utilisateurs.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/conditions',
  },
};

export default function ConditionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
