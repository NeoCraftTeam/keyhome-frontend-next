import type { ChatLocaleText } from '@mui/x-chat/headless';

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  sending: 'Envoi…',
  streaming: 'En cours…',
  sent: 'Envoyé',
  read: 'Lu',
  error: 'Erreur',
  cancelled: 'Annulé',
};

const toolLabels: Record<string, string> = {
  'input-streaming': 'En cours…',
  'input-available': 'En cours…',
  'approval-requested': 'En attente',
  'approval-responded': 'En cours…',
  'output-available': 'Terminé',
  'output-error': 'Échoué',
  'output-denied': 'Refusé',
};

/**
 * French locale for MUI X Chat — P2P messaging context.
 */
export const chatFrFR: Partial<ChatLocaleText> = {
  composerInputPlaceholder: 'Écrivez un message…',
  composerInputAriaLabel: 'Message',
  composerSendButtonLabel: 'Envoyer',
  composerAttachButtonLabel: 'Joindre un fichier',
  composerAttachInputLabel: 'Télécharger un fichier',
  messageCopyButtonLabel: 'Copier',
  messageCopyCodeButtonLabel: 'Copier le code',
  messageCopiedCodeButtonLabel: 'Copié',
  messageEditedLabel: 'Modifié',
  messageDeletedLabel: 'Message supprimé',
  messageReasoningLabel: 'Raisonnement',
  messageReasoningStreamingLabel: 'Réflexion…',
  messageToolInputLabel: 'Entrée',
  messageToolOutputLabel: 'Sortie',
  messageToolApproveButtonLabel: 'Approuver',
  messageToolDenyButtonLabel: 'Refuser',
  conversationListNoConversationsLabel: 'Aucune conversation',
  conversationListSearchPlaceholder: 'Rechercher…',
  unreadMarkerLabel: 'Nouveaux messages',
  retryButtonLabel: 'Réessayer',
  reconnectButtonLabel: 'Reconnecter',
  scrollToBottomLabel: 'Défiler vers le bas',
  threadNoMessagesLabel: 'Aucun message',
  threadNoMessagesHelperText: 'Envoyez un message pour commencer',
  genericErrorLabel: 'Une erreur est survenue',
  loadingLabel: 'Chargement…',
  suggestionsLabel: 'Suggestions',
  messageListLabel: 'Messages',
  messageLabel: 'Message',
  conversationHeaderMenuLabel: 'Conversations',
  conversationHeaderNewChatLabel: 'Nouvelle conversation',
  conversationHeaderSettingsLabel: 'Paramètres',

  messageStatusLabel: (status) => statusLabels[status] ?? status,
  toolStateLabel: (state) => toolLabels[state] ?? state,

  messageTimestampLabel: (dateTime: string) => {
    const d = new Date(dateTime);
    return Number.isNaN(d.getTime())
      ? dateTime
      : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  conversationTimestampLabel: (dateTime: string) => {
    const d = new Date(dateTime);
    if (Number.isNaN(d.getTime())) return dateTime;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
    if (diff === 0)
      return d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    if (diff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  },

  typingIndicatorLabel: (users) => {
    const names = users.map((u) => u.displayName ?? u.id).join(', ');
    return users.length === 1 ? `${names} écrit…` : `${names} écrivent…`;
  },

  scrollToBottomWithCountLabel: (count) =>
    `${count} nouveau${count > 1 ? 'x' : ''} message${count > 1 ? 's' : ''}`,
};
