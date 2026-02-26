import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription gratuite',
  description:
    "Créez votre compte KeyHome gratuitement en 30 secondes. Accédez à des milliers d'annonces immobilières vérifiées en Afrique : maisons, appartements, terrains et villas.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/register',
  },
  openGraph: {
    title: 'Inscription gratuite — KeyHome',
    description:
      "Rejoignez KeyHome et trouvez votre logement idéal en Afrique. Inscription gratuite, annonces vérifiées.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
