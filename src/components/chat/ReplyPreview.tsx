'use client';

import type { Message } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { X } from 'lucide-react';

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
  theme?: ChatTheme;
}

/**
 * Inline reply bar displayed above the message input when replying to a message.
 *
 * E2EE messages: prefer the locally-decrypted body when available; fall back to
 * a labeled placeholder when the message is sealed but cannot be decrypted on
 * this device.
 */
export function ReplyPreview({
  message,
  onCancel,
  theme = CLIENT_THEME,
}: ReplyPreviewProps) {
  const senderName = message.sender?.name ?? 'Utilisateur';

  let preview: string;
  if (message.is_client_sealed) {
    // E2EE désactivé par défaut depuis mai 2026 — ce fallback couvre uniquement
    // les anciens messages sealed ouverts depuis un nouvel appareil. Les nouveaux
    // messages passent par le chiffrement serveur et sont lisibles partout.
    preview = message.decrypted_body
      ? message.decrypted_body.slice(0, 80)
      : 'Message d’un ancien appareil';
  } else if (message.body) {
    preview = message.body.slice(0, 80);
  } else if (message.attachments?.[0]) {
    const a = message.attachments[0];
    preview =
      a.type === 'image'
        ? '📷 Photo'
        : a.type === 'audio'
          ? '🎙 Message vocal'
          : (a.original_name ?? '📎 Pièce jointe');
  } else {
    preview = '📎 Pièce jointe';
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{
        backgroundColor: theme.accentLighter,
        borderLeft: `3px solid ${theme.accent}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-[11.5px] font-semibold truncate"
          style={{ color: theme.accent }}
        >
          {senderName}
        </p>
        <p
          className="text-[12px] truncate leading-snug"
          style={{ color: theme.textSecondary }}
        >
          {preview}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="shrink-0 rounded-full p-1.5 transition-colors"
        style={{ backgroundColor: theme.accentLight }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = `${theme.accent}20`)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = theme.accentLight)
        }
        aria-label="Annuler la réponse"
      >
        <X className="h-3.5 w-3.5" style={{ color: theme.accent }} />
      </button>
    </div>
  );
}
