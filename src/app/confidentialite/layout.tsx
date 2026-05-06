import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — KeyHome',
  description: `${BRAND_TAGLINE}. Découvrez comment KeyHome protège vos données personnelles. Notre politique de confidentialité détaille la collecte, l'utilisation et la sécurisation de vos informations sur notre plateforme immobilière en Afrique.`,
  robots: { index: true, follow: true },
  alternates: {
    canonical: absoluteUrl('/confidentialite'),
  },
  openGraph: {
    title: 'Politique de Confidentialité — KeyHome',
    description: `${BRAND_TAGLINE}. Comment KeyHome protège vos données : collecte, utilisation, sécurité et vos droits.`,
    url: absoluteUrl('/confidentialite'),
    siteName: 'KeyHome',
    type: 'website',
    locale: 'fr_FR',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'KeyHome — Confidentialité',
      },
    ],
  },
};

export default function ConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
