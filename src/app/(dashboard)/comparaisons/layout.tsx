import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparer des annonces',
  description:
    'Comparez côte à côte les annonces immobilières que vous avez sélectionnées. Prix, surface, chambres, équipements et plus.',
};

export default function ComparaisonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
