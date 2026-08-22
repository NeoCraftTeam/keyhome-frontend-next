import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Vos conversations avec les candidats à la location.',
  robots: { index: false, follow: false },
};

/**
 * /owner/messages — coquille. La liste et le fil sont rendus par le shell
 * persistant (owner/messages/layout.tsx → ChatShell variant="owner"), qui lit
 * le segment de route pour savoir quelle conversation afficher. Cette page ne
 * porte que la route + ses métadonnées.
 */
export default function OwnerMessagesPage() {
  return null;
}
