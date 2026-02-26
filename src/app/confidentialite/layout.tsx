import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — KeyHome',
  description:
    "Découvrez comment KeyHome protège vos données personnelles. Notre politique de confidentialité détaille la collecte, l'utilisation et la sécurisation de vos informations sur notre plateforme immobilière.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/confidentialite',
  },
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
