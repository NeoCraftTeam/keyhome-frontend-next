import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import JsonLd from '@/components/seo/JsonLd';
import { WebVitals } from '@/components/seo/WebVitals';
import { Analytics } from "@vercel/analytics/next";
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import NetworkStatus from '@/components/pwa/NetworkStatus';
import CookieBanner from '@/components/ui/CookieBanner';
import { getClerkPreconnectOrigin } from '@/lib/clerk-frontend-origins';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://keyhome.app'),
  title: {
    default: 'KeyHome — Immobilier en Afrique : Location, Vente, Terrains',
    template: '%s | KeyHome',
  },
  description:
    "KeyHome : annonces immobilières vérifiées en Afrique. Maisons, appartements, terrains à Douala, Abidjan, Cotonou, Lomé. Inscription gratuite, zéro arnaque.",
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
      'x-default': 'https://keyhome.app',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://keyhome.app',
    siteName: 'KeyHome',
    title: 'KeyHome — Trouvez votre logement en Afrique',
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
    title: 'KeyHome — Immobilier en Afrique',
    description:
      "Trouvez votre logement idéal parmi des milliers d'annonces vérifiées. Inscription gratuite, paiement sécurisé, contact direct propriétaire.",
    images: ['/images/og-cover.png'],
    creator: '@keyhome_app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KeyHome',
  },
  // Next.js 16 emits `mobile-web-app-capable` from appleWebApp.capable.
  // Add the Apple-specific tag explicitly for older Apple WebKit and tooling.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  category: 'real estate',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  const clerkOrigin = getClerkPreconnectOrigin();
  return (
    <ClerkProvider
      localization={frFR}
      signInUrl="/login"
      signUpUrl="/register"
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
      nonce={nonce}
    >
      <html lang="fr" suppressHydrationWarning>
        <head>
          {/* suppressHydrationWarning: browser redacts nonce after parsing, causing mismatch */}
          <script
            suppressHydrationWarning
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.style.colorScheme=d?"dark":"light";})();`,
            }}
          />
          <link rel="preconnect" href="https://api.mapbox.com" />
          {clerkOrigin ? (
            <>
              <link rel="preconnect" href={clerkOrigin} />
              <link rel="dns-prefetch" href={clerkOrigin} />
            </>
          ) : null}
          <link rel="dns-prefetch" href="https://api.mapbox.com" />
          <JsonLd />
        </head>
        <body className={`${inter.variable} ${jakarta.variable} antialiased`}>
          <Providers nonce={nonce}>{children}
            <Analytics />
            <WebVitals />
            <ServiceWorkerRegistrar />
            <PWAInstallPrompt />
            <NetworkStatus />
            <CookieBanner />
            <SpeedInsights />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
