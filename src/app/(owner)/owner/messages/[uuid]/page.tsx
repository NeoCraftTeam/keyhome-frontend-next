import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

/**
 * /owner/messages/[uuid] — coquille. Le shell persistant
 * (owner/messages/layout.tsx → ChatShell variant="owner") lit l'uuid via le
 * segment de route et le brouillon éventuel via `?draft=`. Aucune UI ici : la
 * navigation vers une conversation ne remonte ni la liste ni le WebSocket
 * (comportement WhatsApp Web).
 */
export default function OwnerConversationPage() {
  return null;
}
