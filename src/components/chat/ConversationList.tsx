'use client';

import { useConversations } from '@/hooks/useConversations';
import { useConversationsTyping } from '@/hooks/useConversationsTyping';
import type { Conversation } from '@/types/chat';
import { ConversationItem } from './ConversationItem';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { ArrowLeft, MessageSquare, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { smartBack } from '@/lib/smart-back';

interface ConversationListProps {
  activeUuid?: string;
  basePath?: string;
  theme?: ChatTheme;
  /**
   * Fallback destination when browser history can't safely go back (referrer
   * empty, cross-origin, or an auth page). Triggers `smartBack`. If absent,
   * the back button is hidden.
   */
  backHref?: string;
}

/**
 * Left-sidebar conversation list with search.
 * Themed with accent color per panel (owner=teal, client=pink).
 */
export function ConversationList({
  activeUuid,
  basePath = '/messages',
  theme = CLIENT_THEME,
  backHref,
}: ConversationListProps) {
  const { conversations, isLoading, isError, refetch } = useConversations();
  const typingMap = useConversationsTyping(conversations);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const handleBack = useCallback(() => {
    if (backHref) smartBack(router, backHref);
  }, [router, backHref]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c: Conversation) =>
        c.other_participant?.name?.toLowerCase().includes(q) ||
        c.ad?.title?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Count conversations with unread, not total messages (WhatsApp-style).
  const totalUnread = conversations.filter(
    (c) => (c.unread_count ?? 0) > 0
  ).length;

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 76,
    overscan: 8,
  });

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ backgroundColor: theme.listBg }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 shrink-0"
        style={{
          borderBottom: `1px solid ${theme.glassBorder}`,
          background: theme.isDark
            ? theme.listBg
            : 'linear-gradient(180deg, #ffffff 60%, #fafafa 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {backHref && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full p-1.5 -ml-1 transition-all active:scale-95"
                style={{
                  color: theme.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = theme.accentLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
                aria-label="Retour"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2
              className="text-lg font-bold tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              Messages
            </h2>
          </div>
          {totalUnread > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 2px 8px ${theme.accent}40`,
              }}
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-200"
          style={{
            backgroundColor: searchFocused
              ? theme.isDark
                ? 'rgba(255,255,255,0.10)'
                : '#fff'
              : theme.inputBg,
            boxShadow: searchFocused
              ? `0 0 0 2px ${theme.accent}30, 0 2px 8px rgba(0,0,0,0.04)`
              : `0 0 0 1px ${theme.glassBorder}`,
            color: theme.textPrimary,
          }}
        >
          <Search
            className="h-4 w-4 shrink-0 transition-colors duration-200"
            style={{ color: searchFocused ? theme.accent : '#9ca3af' }}
          />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: theme.textPrimary } as React.CSSProperties}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="rounded-full p-0.5 hover:bg-gray-200/60 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* List — wheel events stop here; never bubble to <body>. */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex flex-col">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: '1px solid #f5f5f5' }}
              >
                <div
                  className="h-12 w-12 rounded-full shrink-0"
                  style={{
                    background: `linear-gradient(110deg, #f0f0f0 30%, ${theme.shimmer} 50%, #f0f0f0 70%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                  }}
                />
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div
                      className="h-3.5 rounded-full w-[45%]"
                      style={{
                        background: `linear-gradient(110deg, #f0f0f0 30%, ${theme.shimmer} 50%, #f0f0f0 70%)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                    <div
                      className="h-3 rounded-full w-10"
                      style={{
                        background: `linear-gradient(110deg, #f0f0f0 30%, ${theme.shimmer} 50%, #f0f0f0 70%)`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                        animationDelay: `${i * 0.08 + 0.1}s`,
                      }}
                    />
                  </div>
                  <div
                    className="h-3 rounded-full w-[65%]"
                    style={{
                      background: `linear-gradient(110deg, #f5f5f5 30%, ${theme.shimmer} 50%, #f5f5f5 70%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.08 + 0.2}s`,
                    }}
                  />
                </div>
              </div>
            ))}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: theme.textSecondary }}
            >
              Impossible de charger les conversations
            </p>
            <p
              className="text-xs mb-4 max-w-[260px] leading-relaxed"
              style={{ color: theme.textMuted }}
            >
              Problème réseau ou serveur. Vos messages ne sont pas supprimés —
              réessayez ou vérifiez que l’API répond.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white min-h-[44px] transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: theme.accent }}
            >
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.accentLighter})`,
                border: `1px solid ${theme.glassBorder}`,
              }}
            >
              <MessageSquare
                className="h-9 w-9"
                style={{ color: theme.accent }}
              />
            </div>
            <p
              className="text-sm font-semibold mb-1.5"
              style={{ color: theme.textSecondary }}
            >
              {search ? 'Aucun résultat' : 'Aucune conversation'}
            </p>
            <p
              className="text-xs leading-relaxed max-w-[220px]"
              style={{ color: theme.textMuted }}
            >
              {search
                ? 'Essayez un autre nom ou titre.'
                : 'Débloquez une annonce pour démarrer une conversation avec un propriétaire.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${Math.max(virtualizer.getTotalSize(), 1)}px`,
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((vItem) => {
              const conv = filtered[vItem.index];
              return (
                <div
                  key={conv.uuid}
                  data-index={vItem.index}
                  ref={(node) => {
                    if (node) virtualizer.measureElement(node);
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vItem.start}px)`,
                  }}
                >
                  <ConversationItem
                    conversation={conv}
                    isActive={conv.uuid === activeUuid}
                    basePath={basePath}
                    theme={theme}
                    isTyping={!!typingMap[conv.uuid]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
