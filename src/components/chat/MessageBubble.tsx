'use client';

import React from 'react';
import type { Message } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { AttachmentPreview } from './AttachmentPreview';
import {
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Reply,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isNew?: boolean;
  recipientAvatar?: string | null;
  recipientName?: string | null;
  onReply: (message: Message) => void;
  onDelete?: (uuid: string) => void;
  onScrollToReply?: (uuid: string) => void;
  theme?: ChatTheme;
  /** When set, highlights matching text in the message body. */
  searchQuery?: string;
}

/** URL regex — split keeps URLs as odd-index elements */
const URL_SPLIT = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

/** Resolve a URL to a short human-readable label. */
function urlLabel(href: string): string {
  try {
    const { pathname, hostname } = new URL(href);
    if (pathname.includes('/ads/')) return 'Voir l’annonce';
    return hostname.replace(/^www\./, '');
  } catch {
    return 'Ouvrir le lien';
  }
}

/**
 * Resolve an ad URL to the correct panel path.
 * Owner panel: /owner/ads/{slug} (slug extracted from /ads/{slug}).
 * Client panel: original href unchanged.
 */
function resolveAdHref(href: string, isOwnerPanel: boolean): string {
  if (!isOwnerPanel) return href;
  try {
    const url = new URL(href);
    const m = url.pathname.match(/^\/ads\/([^/]+)/);
    if (m) return `/owner/ads/${m[1]}`;
  } catch {
    /* external URL — keep as-is */
  }
  return href;
}

/** Clickable pill chip — hides raw URL behind a readable label. */
function UrlChip({
  href,
  isOwn,
  isOwnerPanel = false,
}: {
  href: string;
  isOwn: boolean;
  isOwnerPanel?: boolean;
}) {
  const resolved = resolveAdHref(href, isOwnerPanel);
  return (
    <a
      href={resolved}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 hover:opacity-80 active:scale-[0.97]"
      style={{
        backgroundColor: isOwn ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.07)',
        color: isOwn ? 'rgba(255,255,255,0.96)' : 'inherit',
        textDecoration: 'none',
      }}
    >
      <ExternalLink className="h-3 w-3 shrink-0" />
      {urlLabel(href)}
    </a>
  );
}

/** Highlight search matches within a plain-text segment. */
const HighlightText = React.memo(function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm px-0.5"
            style={{
              backgroundColor: 'rgba(251,191,36,0.55)',
              color: 'inherit',
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
});

/** Render message body with URL chips instead of raw links + search highlight. */
function MessageText({
  body,
  isOwn,
  searchQuery,
  isOwnerPanel,
}: {
  body: string;
  isOwn: boolean;
  searchQuery?: string;
  isOwnerPanel?: boolean;
}) {
  const parts = body.split(URL_SPLIT);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <UrlChip
            key={i}
            href={part}
            isOwn={isOwn}
            isOwnerPanel={isOwnerPanel}
          />
        ) : searchQuery ? (
          <HighlightText key={i} text={part} query={searchQuery} />
        ) : (
          part
        )
      )}
    </p>
  );
}

/**
 * Read-receipt tick icon rendered BELOW the bubble on the chat background.
 *
 * ⏱  sending   — clock, light gray         (not yet delivered to server)
 * ✓  sent      — single check, gray        (server confirmed, recipient offline)
 * ✓✓ delivered — double check, gray        (recipient online, not yet read)
 * ✓✓ read      — double check, brand color (recipient opened the message)
 */
export function StatusIcon({
  status,
  theme,
}: {
  status: Message['status'];
  theme: ChatTheme;
}) {
  if (status === 'sending')
    return <Clock className="h-[11px] w-[11px] text-gray-300" />;
  if (status === 'sent')
    return <Check className="h-[11px] w-[11px] text-gray-400" />;
  if (status === 'delivered')
    return <CheckCheck className="h-[11px] w-[11px] text-gray-400" />;
  return (
    <CheckCheck
      className="h-[11px] w-[11px]"
      style={{ color: theme.readTick }}
    />
  );
}

/**
 * Individual message bubble — enterprise WhatsApp / iMessage style.
 *
 * Own messages  → right-aligned, gradient accent, white text
 * Other messages → left-aligned, white with subtle shadow
 * Deleted        → italic gray dashed-border
 * System         → centered pill
 */
export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isNew = false,
  recipientAvatar,
  recipientName,
  onReply,
  onDelete,
  onScrollToReply,
  theme = CLIENT_THEME,
  searchQuery,
}: MessageBubbleProps) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (longPressRef.current) clearTimeout(longPressRef.current);
    };
  }, []);

  const handleLongPress = useCallback(() => {
    onReply(message);
  }, [message, onReply]);

  const onTouchStart = () => {
    longPressRef.current = setTimeout(handleLongPress, 500);
  };
  const onTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2.5">
        <span
          className="text-[11px] rounded-full px-3 py-1 shadow-sm"
          style={{
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.80)',
            color: theme.textMuted,
            border: `1px solid ${theme.glassBorder}`,
          }}
        >
          {message.body}
        </span>
      </div>
    );
  }

  const isDeleted = message.deleted_at !== null;
  const time = format(new Date(message.created_at), 'HH:mm', { locale: fr });
  const initial = recipientName?.charAt(0).toUpperCase() ?? '?';

  const animStyle = isNew
    ? { animation: 'msgIn 0.22s cubic-bezier(0.34,1.36,0.64,1) both' }
    : undefined;

  return (
    <div
      className={`group flex items-end gap-2 ${showAvatar ? 'mt-2.5' : 'mt-[3px]'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      data-message-uuid={message.uuid}
      style={animStyle}
    >
      {/* Avatar for other party */}
      {!isOwn && (
        <div className="w-8 shrink-0 self-end mb-4">
          {showAvatar ? (
            recipientAvatar ? (
              <Image
                src={recipientAvatar}
                alt="avatar"
                width={30}
                height={30}
                className="rounded-full object-cover"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
              />
            ) : (
              <div
                className="h-[30px] w-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
                }}
              >
                {initial}
              </div>
            )
          ) : (
            <div className="h-[30px] w-[30px]" />
          )}
        </div>
      )}

      {/* Bubble + meta */}
      <div
        className={`max-w-[75%] md:max-w-[65%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {/* Main bubble — reply quote lives INSIDE so quote + body look like one unit */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`text-[14px] leading-relaxed select-none overflow-hidden ${
            isDeleted
              ? 'rounded-2xl border border-dashed px-3.5 py-2.5'
              : isOwn
                ? 'text-white rounded-[18px] rounded-br-[6px]'
                : 'rounded-[18px] rounded-bl-[6px]'
          }`}
          style={
            isDeleted
              ? {
                  fontStyle: 'italic',
                  color: theme.textMuted,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : '#e5e7eb',
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.04)'
                    : '#f9fafb',
                }
              : isOwn
                ? {
                    background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.bubbleGradientEnd} 100%)`,
                    boxShadow: `0 3px 12px ${theme.accent}40, 0 1px 3px ${theme.accent}20`,
                  }
                : {
                    backgroundColor: theme.surfaceBg,
                    color: theme.surfaceText,
                    boxShadow: theme.isDark
                      ? '0 2px 8px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)'
                      : '0 2px 8px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)',
                  }
          }
        >
          {isDeleted ? (
            <span className="text-[13px]">Ce message a été supprimé</span>
          ) : (
            <>
              {/* Reply quote — inside the bubble, above the body */}
              {message.reply_to && (
                <button
                  onClick={() => onScrollToReply?.(message.reply_to!.uuid)}
                  className="w-full text-left px-3 pt-2.5 pb-1.5 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="rounded-lg px-2.5 py-1.5 text-xs"
                    style={
                      isOwn
                        ? {
                            borderLeft: '3px solid rgba(255,255,255,0.55)',
                            backgroundColor: 'rgba(0,0,0,0.12)',
                            color: 'rgba(255,255,255,0.82)',
                          }
                        : {
                            borderLeft: `3px solid ${theme.accent}`,
                            backgroundColor: theme.accentLighter,
                            color: theme.textSecondary,
                          }
                    }
                  >
                    <span className="line-clamp-2 leading-snug">
                      {message.reply_to.body ?? '📎 Pièce jointe'}
                    </span>
                  </div>
                </button>
              )}

              {/* Actual message content */}
              <div
                className={message.reply_to ? 'px-3.5 pb-2.5' : 'px-3.5 py-2.5'}
              >
                {message.attachments?.map((att, i) => (
                  <AttachmentPreview key={i} attachment={att} isOwn={isOwn} />
                ))}
                {message.body && (
                  <MessageText
                    body={message.body}
                    isOwn={isOwn}
                    searchQuery={searchQuery}
                    isOwnerPanel={theme.isOwnerPanel}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Timestamp + status */}
        <div
          className={`flex items-center gap-1 px-1.5 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <span
            className="text-[10.5px] tabular-nums"
            style={{ color: theme.textMuted }}
          >
            {time}
          </span>
          {isOwn && !isDeleted && (
            <StatusIcon status={message.status} theme={theme} />
          )}
        </div>
      </div>

      {/* Hover reply/delete actions (desktop) */}
      {!isDeleted && (
        <div
          className={`shrink-0 self-center opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-150 ${isOwn ? 'mr-0.5' : 'ml-0.5'}`}
        >
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-full shadow-sm transition-colors backdrop-blur-sm"
            style={{
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(255,255,255,0.90)',
              border: `1px solid ${theme.glassBorder}`,
              color: theme.textMuted,
            }}
            title="Répondre"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(message.uuid)}
              className="p-1.5 rounded-full shadow-sm transition-colors backdrop-blur-sm"
              style={{
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.90)',
                border: `1px solid ${theme.glassBorder}`,
                color: theme.textMuted,
              }}
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
