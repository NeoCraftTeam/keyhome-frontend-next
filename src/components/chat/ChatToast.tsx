'use client';

import { closeSnackbar, type CustomContentProps } from 'notistack';
import { forwardRef } from 'react';
import { MessageSquare, X } from 'lucide-react';

declare module 'notistack' {
  interface VariantOverrides {
    chatMessage: {
      accentColor: string;
      onClick?: () => void;
    };
  }
}

interface ChatToastProps extends CustomContentProps {
  accentColor: string;
  onClick?: () => void;
}

/**
 * Branded chat-message toast (replaces notistack's sky-blue 'info' variant).
 * - `accentColor` drives the entire visual identity (pink for client, teal for owner).
 * - Clickable surface navigates to the conversation; "X" button dismisses.
 *
 * Idempotent: pass any hex/rgb color via the `accentColor` prop.
 */
const ChatToast = forwardRef<HTMLDivElement, ChatToastProps>(function ChatToast(
  { id, message, accentColor, onClick },
  ref
) {
  return (
    <div
      ref={ref}
      role="alert"
      aria-live="polite"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 320,
        maxWidth: 420,
        padding: '12px 14px 12px 12px',
        borderRadius: 14,
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        boxShadow: `0 8px 28px rgba(0,0,0,0.14), 0 0 0 1px ${accentColor}30`,
        borderLeft: `4px solid ${accentColor}`,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <MessageSquare size={18} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.35 }}>
        {typeof message === 'string' ? (
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontWeight: 500,
            }}
          >
            {message}
          </span>
        ) : (
          message
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          closeSnackbar(id);
        }}
        aria-label="Fermer"
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          padding: 4,
          borderRadius: 6,
          cursor: 'pointer',
          color: '#9ca3af',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
});

export default ChatToast;
