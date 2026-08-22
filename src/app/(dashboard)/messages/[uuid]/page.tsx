import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversation',
  robots: { index: false, follow: false },
};

/**
 * /messages/[uuid] — coquille. Le shell persistant (messages/layout.tsx →
 * ChatShell) lit l'uuid via le segment de route et le brouillon éventuel via
 * `?draft=`. Aucune UI ici : la navigation vers une conversation ne remonte
 * ni la liste ni le WebSocket (comportement WhatsApp Web).
 */
export default function ConversationPage() {
  return null;
}
