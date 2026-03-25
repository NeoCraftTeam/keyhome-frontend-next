import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — KeyHome',
  description: 'Consultez vos notifications : nouvelles annonces, alertes de recherche, paiements et messages.',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
