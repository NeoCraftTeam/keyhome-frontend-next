import IosSplashLinks from '@/components/pwa/IosSplashLinks';
import NetworkStatus from '@/components/pwa/NetworkStatus';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import PWASplash from '@/components/pwa/PWASplash';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import ViewportInteractiveWidget from '@/components/pwa/ViewportInteractiveWidget';
import JsonLd from '@/components/seo/JsonLd';
import { WebVitals } from '@/components/seo/WebVitals';
import { ThemeInitScript } from '@/components/ThemeInitScript';
import CookieBanner from '@/components/ui/CookieBanner';
import RouteProgressBar from '@/components/ui/RouteProgressBar';
import { GOOGLE_CONSENT_MODE_DEFAULT_SCRIPT } from '@/lib/analytics/consent-default-inline';
import { isGoogleMarketingConfigured } from '@/lib/analytics/google-marketing-env';
import { BRAND_TAGLINE, BRAND_TITLE_WITH_TAGLINE } from '@/lib/brand';
import { getClerkPreconnectOrigin } from '@/lib/clerk-frontend-origins';
import { KH_SAFE_AREA_INIT_SCRIPT } from '@/lib/safe-area-init-inline';
import { buildSiteVerification } from '@/lib/seo-verification';
import { getSiteOrigin } from '@/lib/site-url';
import { frFR } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from './providers';

const SITE = getSiteOrigin();
const siteVerification = buildSiteVerification();

const SITE_META_DESCRIPTION = `${BRAND_TAGLINE}. KeyHome : des milliers d'annonces immobilières vérifiées. Maisons, appartements, terrains et villas à Douala, Abidjan, Cotonou, Lomé et partout dans le monde. Inscription gratuite, paiement sécurisé.`;

const TWITTER_CARD_DESCRIPTION = `${BRAND_TAGLINE}. Trouvez votre bien parmi des milliers d'annonces vérifiées. Inscription gratuite, paiement sécurisé, contact direct.`;

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
  metadataBase: new URL(SITE),
  title: {
    default: BRAND_TITLE_WITH_TAGLINE,
    template: '%s | KeyHome',
  },
  description: SITE_META_DESCRIPTION,
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
  authors: [{ name: 'KeyHome', url: SITE }],
  creator: 'NeoCraftTeam',
  publisher: 'Cedrick Feze',
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
    canonical: SITE,
    languages: {
      'fr-FR': SITE,
      'x-default': SITE,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE,
    siteName: 'KeyHome',
    title: BRAND_TITLE_WITH_TAGLINE,
    description: SITE_META_DESCRIPTION,
    images: [
      {
        url: `${SITE}/images/og-cover.png`,
        width: 1200,
        height: 630,
        alt: BRAND_TITLE_WITH_TAGLINE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE_WITH_TAGLINE,
    description: TWITTER_CARD_DESCRIPTION,
    creator: '@keyhome_app',
    images: [`${SITE}/images/og-cover.png`],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      // 180x180 is the size Apple actually serves on modern iPhones; using
      // an exact-size asset prevents Safari from down-scaling 192px on the fly.
      { url: '/icons/icon-180x180.png', sizes: '180x180' },
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
  ...(siteVerification ? { verification: siteVerification } : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /**
   * Initial HTML ships with zoom locked so the very first paint of the
   * installed PWA matches the native-app feel. `ViewportInteractiveWidget`
   * re-evaluates this on the client and *re-enables* pinch-zoom (up to 500%)
   * when the page is loaded inside a regular browser tab — that keeps WCAG
   * 1.4.4 satisfied for browser users while preserving the locked feel for
   * users who installed the PWA on their home screen.
   */
  maximumScale: 1,
  userScalable: false,
  // Brand-aware status bar: pink on the customer panel (this root viewport),
  // teal on the owner panel (overridden at runtime by `OwnerManifestSwitch`).
  // Dark mode keeps the deep neutral background so the OS status bar blends
  // with the dark surface instead of glowing pink in low light.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6475F' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
  viewportFit: 'cover',
  // `interactiveWidget` is applied client-side in `ViewportInteractiveWidget`
  // so Safari does not warn on unknown viewport keys; Chromium still gets
  // `resizes-content` for keyboard/layout sync (see component docstring).
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
          {isGoogleMarketingConfigured() ? (
            <script
              id="google-consent-default"
              nonce={nonce}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: GOOGLE_CONSENT_MODE_DEFAULT_SCRIPT,
              }}
            />
          ) : null}
          <script
            id="kh-safe-area-init"
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: KH_SAFE_AREA_INIT_SCRIPT }}
          />
          <link rel="preconnect" href="https://api.mapbox.com" />
          <IosSplashLinks panel="client" />
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
          <ViewportInteractiveWidget />
          <PWASplash panel="client" />
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

          {/* Cloudflare Web Analytics */}
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "843502f324fe4d9c89c57bbc88c80fd7"}'
          ></script>
          {/* End Cloudflare Web Analytics */}
        </body>
      </html>
    </ClerkProvider>
  );
}
