import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions générales d'utilisation de la plateforme KeyHome. Règles de publication, politique de paiement, responsabilités et droits des utilisateurs.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/conditions',
  },
};

export default function ConditionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
