'use client';

import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import type { Conversation } from '@/types/chat';
import { prefetchChatMessages } from '@/hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Home } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef } from 'react';
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
  const unread = conversation.unread_count > 0;
  const lastMsg = conversation.last_message;
  const ad = conversation.ad;

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
        locale: fr,
      })
    : '';

  const isOwnLastMsg = !!lastMsg?.sender_id && lastMsg.sender_id === user?.id;
  const rawPreview = lastMsg?.body
    ? lastMsg.body.slice(0, 52)
    : lastMsg?.type === 'image'
      ? '📷 Photo'
      : lastMsg?.type === 'file'
        ? '📎 Document'
        : null;
  const preview = rawPreview ?? 'Démarrez la conversation';

  const initial = participant?.name?.charAt(0).toUpperCase() ?? '?';

  const warmCache = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    prefetchChatMessages(queryClient, conversation.uuid);
  }, [queryClient, conversation.uuid]);

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

      {/* Avatar + ad thumbnail badge */}
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

        {/* Ad thumbnail badge — bottom-right corner of avatar */}
        {ad && (
          <div
            className="absolute -bottom-1 -right-1 h-[22px] w-[22px] rounded-md overflow-hidden border-[2px] shadow-sm"
            style={{ borderColor: theme.isDark ? theme.listBg : '#fff' }}
            title={ad.title}
          >
            {ad.cover_image ? (
              <Image
                src={ad.cover_image}
                alt={ad.title}
                width={22}
                height={22}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ backgroundColor: theme.accentLight }}
              >
                <Home
                  className="h-[11px] w-[11px]"
                  style={{ color: theme.accent }}
                />
              </div>
            )}
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

        {/* Row 2: tick + preview / typing + unread badge */}
        <div className="flex items-center justify-between gap-1.5">
          {isTyping ? (
            <span
              className="text-[12.5px] font-medium flex items-center gap-1"
              style={{ color: theme.accent }}
            >
              est en train d&apos;écrire
              <span className="flex items-center gap-[2px] translate-y-[1px]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-[4px] w-[4px] rounded-full"
                    style={{
                      backgroundColor: theme.accent,
                      animation: 'convTypingDot 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </span>
              <style>{`@keyframes convTypingDot{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
            </span>
          ) : (
            <span className="flex items-center gap-1 min-w-0">
              {/* Own-message read receipt ticks */}
              {isOwnLastMsg && lastMsg?.status && (
                <span className="shrink-0 flex items-center translate-y-[0.5px]">
                  <StatusIcon status={lastMsg.status} theme={theme} />
                </span>
              )}

              {/* Ad pill chip — inline, attached to the message preview */}
              {ad?.slug && (
                <Link
                  href={
                    theme.isOwnerPanel
                      ? `/owner/ads/${ad.id}`
                      : `/ads/${ad.slug}`
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 inline-flex items-center gap-[3px] px-1.5 py-[2px] rounded group/ad"
                  style={{
                    backgroundColor: `${theme.accent}18`,
                    border: `1px solid ${theme.accent}30`,
                  }}
                  title={`Voir l'annonce : ${ad.title}`}
                >
                  <Home
                    className="h-[9px] w-[9px]"
                    style={{ color: theme.accent }}
                  />
                  <span
                    className="text-[10px] font-medium max-w-[80px] truncate group-hover/ad:underline underline-offset-1"
                    style={{ color: theme.accent }}
                  >
                    {ad.title}
                  </span>
                </Link>
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
