import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KeyHome',
  description:
    'Trouvez votre bien immobilier idéal. Locations, ventes, terrains et plus encore.',
  keywords: ['immobilier','Keyhome', 'location', 'vente', 'appartement', 'maison'],
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
        <body className={`${inter.variable} antialiased`}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
