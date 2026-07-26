import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications',
  description:
    'Consultez vos notifications : nouvelles annonces, alertes de recherche, paiements et messages.',
  robots: { index: false, follow: false },
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
