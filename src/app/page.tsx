import LandingPage from '@/components/landing/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "KeyHome — L'immobilier de confiance",
  description:
    "KeyHome : des milliers d'annonces immobilières vérifiées — maisons, appartements, terrains et villas. Recherchez, comparez et contactez directement les propriétaires.",
  keywords: [
    'immobilier Afrique',
    'location maison',
    'achat appartement',
    'terrain à vendre',
    'Cameroun immobilier',
    'Douala',
    'Yaoundé',
    'Abidjan',
    'Cotonou',
    'Lomé',
    'KeyHome',
  ],
  openGraph: {
    title: "KeyHome — L'immobilier de confiance",
    description:
      "Des milliers d'annonces immobilières vérifiées. Accédez aux coordonnées en toute sécurité.",
    type: 'website',
    locale: 'fr_FR',
    siteName: 'KeyHome',
  },
  twitter: {
    card: 'summary_large_image',
    title: "KeyHome — L'immobilier de confiance",
    description:
      "Trouvez votre maison, appartement ou terrain idéal parmi des milliers d'annonces vérifiées.",
  },
  alternates: {
    canonical: 'https://keyhome.app/',
  },
};

/**
 * Root page — rendered as a Server Component so that all static marketing
 * content (H1, descriptions, CTA) is present in the initial HTML for SEO.
 *
 * Authenticated users are redirected to /home by the Clerk middleware
 * (src/middleware.ts) at the edge, before this page ever renders.
 */
export default function RootPage() {
  return <LandingPage />;
}
