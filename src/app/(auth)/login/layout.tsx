import type { Metadata } from 'next';
import { BRAND_TAGLINE } from '@/lib/brand';
import { absoluteUrl, getSiteOrigin } from '@/lib/site-url';

const SITE = getSiteOrigin();

export const metadata: Metadata = {
  title: 'Connexion — Accédez à votre espace KeyHome',
  description: `Connectez-vous à KeyHome et retrouvez vos annonces favorites, vos contacts débloqués et votre historique de paiements. Accès rapide via email ou réseaux sociaux. ${BRAND_TAGLINE}.`,
  robots: { index: false, follow: true },
  alternates: {
    canonical: absoluteUrl('/login'),
  },
  openGraph: {
    title: 'Connexion — KeyHome',
    description: `${BRAND_TAGLINE}. Accédez à votre espace personnel KeyHome. Retrouvez vos annonces, vos favoris et contactez les propriétaires directement.`,
    url: absoluteUrl('/login'),
    siteName: 'KeyHome',
    images: [
      {
        url: `${SITE}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Connexion — KeyHome',
      },
    ],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
