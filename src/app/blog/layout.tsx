import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Immobilier Afrique — Guides, Conseils & Actualités',
  description:
    "Guides pratiques, conseils et actualités sur l'immobilier en Afrique. Prix des loyers, arnaques à éviter, quartiers recommandés à Douala, Abidjan, Cotonou et plus.",
  alternates: {
    canonical: 'https://keyhome.app/blog',
  },
  openGraph: {
    title: 'Blog Immobilier — KeyHome',
    description: "Guides et conseils immobiliers pour l'Afrique. Prix, quartiers, arnaques à éviter.",
    url: 'https://keyhome.app/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

