import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — Accédez à votre espace KeyHome',
  description:
    'Connectez-vous à KeyHome et retrouvez vos annonces favorites, vos contacts débloqués et votre historique de paiements. Accès rapide via email ou réseaux sociaux.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://keyhome.app/login',
  },
  openGraph: {
    title: 'Connexion — KeyHome',
    description: 'Accédez à votre espace personnel KeyHome. Retrouvez vos annonces, vos favoris et contactez les propriétaires directement.',
    url: 'https://keyhome.app/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
