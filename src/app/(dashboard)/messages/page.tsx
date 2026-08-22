import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Vos conversations avec les propriétaires.',
  robots: { index: false, follow: false },
};

/**
 * /messages — coquille. La liste et le fil sont rendus par le shell persistant
 * (messages/layout.tsx → ChatShell), qui lit le segment de route pour savoir
 * quelle conversation afficher. Cette page ne porte que la route + ses métadonnées.
 */
export default function MessagesPage() {
  return null;
}
