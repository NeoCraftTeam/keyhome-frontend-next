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
import { Analytics } from '@vercel/analytics/next';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import NetworkStatus from '@/components/pwa/NetworkStatus';
import CookieBanner from '@/components/ui/CookieBanner';
import RouteProgressBar from '@/components/ui/RouteProgressBar';
import { ThemeInitScript } from '@/components/ThemeInitScript';
import { Suspense } from 'react';
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
    default:
      'KeyHome — Annonces immobilières vérifiées | Location, Vente, Terrains',
    template: '%s | KeyHome',
  },
  description:
    "KeyHome : des milliers d'annonces immobilières vérifiées. Maisons, appartements, terrains et villas à Douala, Abidjan, Cotonou, Lomé et partout dans le monde. Inscription gratuite, paiement sécurisé.",
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
    title: "KeyHome — L'immobilier de confiance",
    description:
      "Des milliers d'annonces immobilières vérifiées. Maisons, appartements, terrains et villas partout dans le monde. " +
      'Inscription gratuite, paiement sécurisé, contact direct avec les propriétaires. Zéro intermédiaire.',
    images: [
      {
        url: 'https://keyhome.app/images/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'KeyHome — Immobilier en Afrique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "KeyHome — L'immobilier de confiance",
    description:
      "Trouvez votre bien idéal parmi des milliers d'annonces vérifiées. Inscription gratuite, paiement sécurisé, contact direct propriétaire.",
    creator: '@keyhome_app',
    images: ['https://keyhome.app/images/og-cover.png'],
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
    { media: '(prefers-color-scheme: dark)', color: '#141419' },
  ],
  viewportFit: 'cover',
  // Make the on-screen keyboard SHRINK the layout viewport instead of
  // overlaying content. Without this, iOS Safari/PWA leaves `100dvh` and
  // `position: fixed` elements at their full layout size, then auto-scrolls
  // the page upward to bring the focused input into view — pushing the chat
  // header off-screen. With `resizes-content`, `dvh` and `100%` containers
  // actually update when the keyboard shows, so the layout adapts naturally
  // (matches Android Chrome behaviour).
  interactiveWidget: 'resizes-content',
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
          {/* ThemeInitScript uses useServerInsertedHTML — injected server-side only,
              never reconciled on the client, so React 19 never warns. */}
          <ThemeInitScript nonce={nonce} />
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
          <Providers nonce={nonce}>
            <Suspense fallback={null}>
              <RouteProgressBar />
            </Suspense>
            {children}
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
