import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — KeyHome',
  description:
    "Découvrez comment KeyHome protège vos données personnelles. Notre politique de confidentialité détaille la collecte, l'utilisation et la sécurisation de vos informations sur notre plateforme immobilière en Afrique.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/confidentialite',
  },
  openGraph: {
    title: 'Politique de Confidentialité — KeyHome',
    description:
      'Comment KeyHome protège vos données : collecte, utilisation, sécurité et vos droits.',
    url: 'https://keyhome.app/confidentialite',
    siteName: 'KeyHome',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function ConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
