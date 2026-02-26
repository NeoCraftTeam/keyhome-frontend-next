import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description:
    "Politique de confidentialité de KeyHome. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles sur notre plateforme immobilière.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/confidentialite',
  },
};

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
