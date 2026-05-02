'use client';

import React from 'react';
import type { Message } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { AttachmentPreview } from './AttachmentPreview';
import { ReactionPicker } from './ReactionPicker';
import {
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Reply,
  Smile,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

/** Horizontal swipe distance (px) past which we trigger the reply action. */
const SWIPE_REPLY_THRESHOLD = 60;
/** Maximum visual offset applied to the bubble while swiping (rubber-band cap). */
const SWIPE_MAX_OFFSET = 80;

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
  /** Toggle a reaction for the current user. Caller wires it to useChat. */
  onToggleReaction?: (messageUuid: string, emoji: string) => void;
  /** Current user id — used to mark reactions as "selected". */
  currentUserId?: string;
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
  onToggleReaction,
  currentUserId,
  theme = CLIENT_THEME,
  searchQuery,
}: MessageBubbleProps) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeAxisLockRef = useRef<'x' | 'y' | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (longPressRef.current) clearTimeout(longPressRef.current);
    };
  }, []);

  // Close the picker on any outside click or scroll.
  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(false);
    document.addEventListener('click', close, { once: true });
    document.addEventListener('scroll', close, { once: true, capture: true });
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, { capture: true });
    };
  }, [pickerOpen]);

  const handleLongPress = useCallback(() => {
    if (onToggleReaction) {
      setPickerOpen(true);
    } else {
      onReply(message);
    }
  }, [message, onReply, onToggleReaction]);

  const ownSelectedEmojis = useMemo(() => {
    if (!currentUserId) return new Set<string>();
    const result = new Set<string>();
    (message.reactions ?? []).forEach((g) => {
      if (g.user_ids.includes(currentUserId)) result.add(g.emoji);
    });
    return result;
  }, [message.reactions, currentUserId]);

  const onTouchStart = (e: React.TouchEvent) => {
    longPressRef.current = setTimeout(handleLongPress, 500);
    const touch = e.touches[0];
    swipeStartXRef.current = touch.clientX;
    swipeStartYRef.current = touch.clientY;
    swipeAxisLockRef.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const startX = swipeStartXRef.current;
    const startY = swipeStartYRef.current;
    if (startX === null || startY === null) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    // Lock to either horizontal swipe (reply) or vertical (let scroll happen).
    if (swipeAxisLockRef.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        swipeAxisLockRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
    }
    if (swipeAxisLockRef.current !== 'x') return;

    // WhatsApp convention: swipe right on others' messages, swipe left on own.
    // We accept both directions for ergonomics. Cancel long-press once we know
    // it's a horizontal gesture.
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    const direction = isOwn ? -1 : 1;
    const projected = dx * direction;
    if (projected <= 0) {
      setSwipeOffset(0);
      return;
    }
    // Rubber-band past the threshold for haptic-feeling feedback.
    const capped =
      projected > SWIPE_MAX_OFFSET
        ? SWIPE_MAX_OFFSET + (projected - SWIPE_MAX_OFFSET) * 0.25
        : projected;
    setSwipeOffset(capped * direction);
  };

  const finishSwipe = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    if (
      swipeAxisLockRef.current === 'x' &&
      Math.abs(swipeOffset) >= SWIPE_REPLY_THRESHOLD
    ) {
      onReply(message);
    }
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    swipeAxisLockRef.current = null;
    setSwipeOffset(0);
  };

  const onTouchEnd = () => finishSwipe();
  const onTouchCancel = () => finishSwipe();

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
  const displayBody =
    message.decrypted_body != null && message.decrypted_body !== ''
      ? message.decrypted_body
      : !message.is_client_sealed
        ? message.body
        : null;
  const time = format(new Date(message.created_at), 'HH:mm', { locale: fr });
  const initial = recipientName?.charAt(0).toUpperCase() ?? '?';

  const animStyle = isNew
    ? { animation: 'msgIn 0.22s cubic-bezier(0.22,1,0.36,1) both' }
    : undefined;

  // Active swipe progress (0 → 1) used to fade the reply icon hint in.
  const swipeProgress = Math.min(
    1,
    Math.abs(swipeOffset) / SWIPE_REPLY_THRESHOLD
  );

  return (
    <div
      className={`group relative flex items-end gap-2 ${showAvatar ? 'mt-2.5' : 'mt-[3px]'} ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      data-message-uuid={message.uuid}
      style={{
        ...animStyle,
        // Slide the bubble row horizontally while swiping; reset on release.
        transform:
          swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition:
          swipeOffset === 0
            ? 'transform 220ms cubic-bezier(0.22,1,0.36,1)'
            : 'none',
      }}
    >
      {/* Emoji picker (long-press) — sits above the bubble */}
      {pickerOpen && onToggleReaction && (
        <div
          className={`absolute z-30 ${isOwn ? 'right-0' : 'left-10'} -top-12`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ReactionPicker
            isOwn={isOwn}
            theme={theme}
            selectedEmojis={ownSelectedEmojis}
            onToggle={(emoji) => {
              onToggleReaction(message.uuid, emoji);
              setPickerOpen(false);
            }}
          />
        </div>
      )}

      {/* Swipe-to-reply visual hint — fades in as the user drags toward the threshold */}
      {swipeOffset !== 0 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-2' : 'left-2'} pointer-events-none`}
          style={{
            opacity: swipeProgress,
            transform: `translateY(-50%) scale(${0.7 + swipeProgress * 0.3})`,
          }}
          aria-hidden
        >
          <div
            className="rounded-full p-2"
            style={{
              backgroundColor: theme.accentLighter,
              boxShadow: `0 1px 4px ${theme.accent}20`,
            }}
          >
            <Reply className="h-4 w-4" style={{ color: theme.accent }} />
          </div>
        </div>
      )}
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
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
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
                      {message.reply_to.body ??
                        (message.reply_to.is_client_sealed
                          ? '🔐 Message sécurisé'
                          : '📎 Pièce jointe')}
                    </span>
                  </div>
                </button>
              )}

              {/* Actual message content */}
              <div
                className={message.reply_to ? 'px-3.5 pb-2.5' : 'px-3.5 py-2.5'}
              >
                {message.attachments?.map((att, i) => (
                  <AttachmentPreview
                    key={i}
                    attachment={att}
                    isOwn={isOwn}
                    theme={theme}
                  />
                ))}
                {displayBody ? (
                  <MessageText
                    body={displayBody}
                    isOwn={isOwn}
                    searchQuery={searchQuery}
                    isOwnerPanel={theme.isOwnerPanel}
                  />
                ) : message.is_client_sealed ? (
                  <span
                    className="text-[13px] opacity-80 italic"
                    style={{
                      color: isOwn ? 'rgba(255,255,255,0.85)' : undefined,
                    }}
                  >
                    🔐 Déchiffrement du message…
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Reaction pills — shown when one or more reactions are present */}
        {!isDeleted && message.reactions && message.reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
            role="group"
            aria-label="Réactions"
          >
            {message.reactions.map((g) => {
              const isMine = currentUserId
                ? g.user_ids.includes(currentUserId)
                : false;
              return (
                <button
                  key={g.emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.uuid, g.emoji)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] transition-all active:scale-95"
                  style={{
                    backgroundColor: isMine
                      ? theme.accentLighter
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.92)',
                    color: isMine ? theme.accent : theme.textSecondary,
                    boxShadow: isMine
                      ? `0 0 0 1px ${theme.accent}55`
                      : theme.isDark
                        ? '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)'
                        : '0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                  }}
                  aria-pressed={isMine}
                  aria-label={`${g.emoji} ${g.count}`}
                >
                  <span aria-hidden>{g.emoji}</span>
                  <span className="font-semibold tabular-nums">{g.count}</span>
                </button>
              );
            })}
          </div>
        )}

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

      {/* Hover reply/react/delete actions (desktop) */}
      {!isDeleted && (
        <div
          className={`shrink-0 self-center opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-150 ${isOwn ? 'mr-0.5' : 'ml-0.5'}`}
        >
          {onToggleReaction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen((o) => !o);
              }}
              className="p-1.5 rounded-full shadow-sm transition-colors backdrop-blur-sm"
              style={{
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,255,255,0.90)',
                border: `1px solid ${theme.glassBorder}`,
                color: theme.textMuted,
              }}
              title="Réagir"
              aria-label="Réagir"
              aria-haspopup="true"
              aria-expanded={pickerOpen}
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
          )}
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
