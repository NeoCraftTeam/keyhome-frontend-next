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
 */
export function ReplyPreview({
  message,
  onCancel,
  theme = CLIENT_THEME,
}: ReplyPreviewProps) {
  const senderName = message.sender?.name ?? 'Utilisateur';
  const preview = message.body
    ? message.body.slice(0, 80)
    : (message.attachments?.[0]?.original_name ?? '📎 Pièce jointe');

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
        <p className="text-[12px] text-gray-500 truncate leading-snug">
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
