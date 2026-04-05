import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alertes de recherche — KeyHome',
  description:
    "Gérez vos alertes de recherche immobilière. Recevez des notifications dès qu'une annonce correspond à vos critères.",
};

export default function SearchAlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
