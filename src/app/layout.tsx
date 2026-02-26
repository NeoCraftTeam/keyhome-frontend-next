import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import JsonLd from '@/components/seo/JsonLd';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://keyhome.app'),
  title: {
    default: 'KeyHome — Immobilier en Afrique : Location, Vente, Terrain sans arnaque',
    template: '%s | KeyHome',
  },
  description:
    "Fini les arnaques et les intermédiaires. KeyHome est la plateforme immobilière #1 en Afrique avec des annonces vérifiées manuellement. " +
    "Trouvez votre maison, appartement, terrain ou villa à Douala, Abidjan, Cotonou, Lomé et dans toute l'Afrique. " +
    "Inscription gratuite, paiement sécurisé par Mobile Money, contact direct avec les propriétaires.",
  keywords: [
    'immobilier Afrique',
    'location appartement',
    'vente maison',
    'terrain à vendre',
    'immobilier Douala',
    'immobilier Cotonou',
    'immobilier Lomé',
    'immobilier Abidjan',
    'annonces immobilières',
    'KeyHome',
    'location villa',
    'achat terrain Afrique',
    'agence immobilière en ligne',
  ],
  authors: [{ name: 'KeyHome', url: 'https://keyhome.app' }],
  creator: 'NeoCraftTeam',
  publisher: 'KeyHome',
  applicationName: 'KeyHome',
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://keyhome.app',
    languages: {
      'fr-FR': 'https://keyhome.app',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://keyhome.app',
    siteName: 'KeyHome',
    title: 'KeyHome — Trouvez votre logement en Afrique sans arnaque',
    description:
      "Des milliers d'annonces immobilières vérifiées. Maisons, appartements, terrains et villas à travers l'Afrique. " +
      "Inscription gratuite, paiement sécurisé Mobile Money, contact direct avec les propriétaires. Zéro intermédiaire.",
    images: [
      {
        url: '/images/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'KeyHome — Immobilier en Afrique',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyHome — Immobilier en Afrique sans arnaque',
    description:
      "Trouvez votre logement idéal parmi des milliers d'annonces vérifiées. Inscription gratuite, paiement sécurisé, contact direct propriétaire.",
    images: ['/images/og-cover.png'],
    creator: '@keyhome_app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/images/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/images/logo.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  category: 'real estate',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={frFR}
      signInUrl="/login"
      signUpUrl="/login"
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    >
      <html lang="fr" suppressHydrationWarning>
        <head>
          <JsonLd />
        </head>
        <body className={`${inter.variable} antialiased`}>
          <Providers>{children}
            <Analytics />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
