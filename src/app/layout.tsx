import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KeyHome — Immobilier au Cameroun',
  description:
    'Trouvez votre bien immobilier idéal au Cameroun. Locations, ventes, terrains et plus encore.',
  keywords: ['immobilier', 'cameroun', 'location', 'vente', 'appartement', 'maison'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
