import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion',
  description:
    'Connectez-vous à votre compte KeyHome pour accéder à vos annonces immobilières favorites, vos paiements et contacter directement les propriétaires.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
