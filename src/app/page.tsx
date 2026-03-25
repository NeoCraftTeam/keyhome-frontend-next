import LandingPage from '@/components/landing/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KeyHome — Trouvez votre logement idéal en Afrique',
  description:
    'Plateforme immobilière panafricaine : des milliers d\'annonces vérifiées de maisons, appartements, terrains et villas. Recherchez, comparez et contactez directement les propriétaires.',
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
    title: 'KeyHome — Trouvez votre logement idéal en Afrique',
    description:
      'Des milliers d\'annonces immobilières vérifiées à travers l\'Afrique. Accédez aux coordonnées en toute sécurité.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'KeyHome',
    images: [{ url: 'https://keyhome.app/images/og-cover.png', width: 1200, height: 630, alt: 'KeyHome — Plateforme immobilière en Afrique' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyHome — Immobilier en Afrique',
    description:
      'Trouvez votre maison, appartement ou terrain idéal parmi des milliers d\'annonces vérifiées.',
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


