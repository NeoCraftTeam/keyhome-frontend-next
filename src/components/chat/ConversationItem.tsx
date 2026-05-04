'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import type { Conversation } from '@/types/chat';
import { prefetchChatMessages } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { StatusIcon } from './MessageBubble';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  basePath?: string;
  theme?: ChatTheme;
  /** True when the other participant is currently typing in this conversation. */
  isTyping?: boolean;
}

export function ConversationItem({
  conversation,
  isActive,
  basePath = '/messages',
  theme = CLIENT_THEME,
  isTyping = false,
}: ConversationItemProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(false);
  const participant = conversation.other_participant;

  useEffect(() => {
    prefetchedRef.current = false;
  }, [user?.id]);
  const unread = conversation.unread_count > 0;
  const lastMsg = conversation.last_message;

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
        locale: fr,
      })
    : '';

  const isOwnLastMsg = !!lastMsg?.sender_id && lastMsg.sender_id === user?.id;
  // Build preview in priority order: sealed → text body → attachment hint.
  // Without this, sealed messages render an empty preview because `body` is null.
  let rawPreview: string | null = null;
  if (lastMsg) {
    if (lastMsg.is_client_sealed) {
      rawPreview = '🔐 Message sécurisé';
    } else if (lastMsg.body) {
      rawPreview = lastMsg.body.slice(0, 52);
    } else if (lastMsg.type === 'image') {
      rawPreview = '📷 Photo';
    } else if (lastMsg.type === 'audio') {
      rawPreview = '🎙 Message vocal';
    } else if (lastMsg.type === 'file') {
      rawPreview = '📎 Document';
    }
  }
  const preview = rawPreview ?? 'Démarrez la conversation';

  const initial = participant?.name?.charAt(0).toUpperCase() ?? '?';

  const warmCache = useCallback(() => {
    if (prefetchedRef.current || !user?.id) return;
    prefetchedRef.current = true;
    prefetchChatMessages(queryClient, user.id, conversation.uuid);
  }, [queryClient, conversation.uuid, user]);

  const navigate = useCallback(() => {
    router.push(`${basePath}/${conversation.uuid}`);
  }, [router, basePath, conversation.uuid]);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => e.key === 'Enter' && navigate()}
      onMouseEnter={warmCache}
      onTouchStart={warmCache}
      className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-all duration-150 relative group active:scale-[0.985]"
      style={{
        backgroundColor: isActive ? theme.activeBg : undefined,
        borderBottom: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5'}`,
      }}
    >
      {/* Active accent bar */}
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ backgroundColor: theme.accent }}
        />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        {participant?.avatar ? (
          <Image
            src={participant.avatar}
            alt={participant.name}
            width={48}
            height={48}
            className="rounded-full object-cover shadow-sm"
            style={{
              boxShadow: isActive
                ? `0 0 0 2px ${theme.accent}30`
                : '0 0 0 2px rgba(0,0,0,0.04)',
            }}
          />
        ) : (
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white shadow-sm"
            style={{
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: name + timestamp */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={`text-[13.5px] truncate leading-tight ${unread ? 'font-semibold' : 'font-medium'}`}
            style={{ color: unread ? theme.textPrimary : theme.textSecondary }}
          >
            {participant?.name ?? 'Utilisateur'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.status === 'archived' && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#fef3c7',
                  color: '#92400e',
                }}
              >
                Archivé
              </span>
            )}
            <span
              className="text-[11px] shrink-0 tabular-nums"
              style={{
                color: unread ? theme.accent : theme.textMuted,
                fontWeight: unread ? 600 : 400,
              }}
            >
              {timeAgo}
            </span>
          </div>
        </div>

        {/* Row 2: tick + preview / typing + unread badge */}
        <div className="flex items-center justify-between gap-1.5">
          {isTyping ? (
            <span
              className="text-[12.5px] font-medium flex items-center gap-1"
              style={{ color: theme.accent }}
            >
              est en train d&apos;écrire
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="kh-list-typing-dot inline-block h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: theme.accent,
                      animation:
                        'khListTypingPulse 1.35s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                      animationDelay: `${i * 0.16}s`,
                    }}
                  />
                ))}
              </span>
              <style>{`@keyframes khListTypingPulse{0%,100%{opacity:.3}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.kh-list-typing-dot{animation:none!important;opacity:.55}}`}</style>
            </span>
          ) : (
            <span className="flex items-center gap-1 min-w-0">
              {/* Own-message read receipt ticks */}
              {isOwnLastMsg && lastMsg?.status && (
                <span className="shrink-0 flex items-center translate-y-[0.5px]">
                  <StatusIcon status={lastMsg.status} theme={theme} />
                </span>
              )}

              <p
                className={`text-[12.5px] truncate leading-relaxed ${unread ? 'font-medium' : ''}`}
                style={{
                  color: unread ? theme.textSecondary : theme.textMuted,
                }}
              >
                {isOwnLastMsg ? `Vous : ${preview}` : preview}
              </p>
            </span>
          )}

          {unread && !isTyping && (
            <span
              className="shrink-0 rounded-full px-[7px] py-[2px] text-[10px] font-bold text-white min-w-[20px] text-center"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 1px 4px ${theme.accent}40`,
              }}
            >
              {conversation.unread_count > 99
                ? '99+'
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>

      {/* Hover highlight overlay */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none rounded-sm"
        style={{
          backgroundColor: isActive
            ? 'transparent'
            : theme.isDark
              ? 'rgba(255,255,255,0.055)'
              : 'rgba(0,0,0,0.038)',
        }}
      />
    </div>
  );
}
