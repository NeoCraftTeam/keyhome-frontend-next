'use client';

import type { Conversation, Message } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { archiveConversation } from '@/lib/chat-api';
import { useEchoConnectionState } from '@/lib/echo';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, MessageCircle, Search, WifiOff, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ChatWindowProps {
  conversation: Conversation;
  backHref?: string;
  theme?: ChatTheme;
  /** Pre-filled message draft (e.g. from ad detail page). Applied once on mount. */
  initialDraft?: string;
}

/** Virtual-list item — date header, message row, load-more button, or typing bubble. */
type FlatItem =
  | { kind: 'load-more' }
  | { kind: 'separator'; date: string }
  | { kind: 'message'; msg: Message; showAvatar: boolean }
  | { kind: 'typing' };

function DateSeparator({ date, theme }: { date: string; theme: ChatTheme }) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = "Aujourd'hui";
  else if (isYesterday(d)) label = 'Hier';
  else label = format(d, 'dd MMMM yyyy', { locale: fr });

  return (
    <div className="flex justify-center py-3">
      <span
        className="text-[11px] font-medium px-3.5 py-1 rounded-full"
        style={{
          color: theme.textMuted,
          backgroundColor: theme.isDark
            ? theme.surfaceBg
            : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          boxShadow: theme.isDark
            ? `0 1px 3px rgba(0,0,0,0.2), 0 0 0 1px ${theme.glassBorder}`
            : '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

const SKELETON_WIDTHS = [
  '52%',
  '38%',
  '60%',
  '45%',
  '55%',
  '35%',
  '42%',
  '58%',
];

function MessageSkeleton({
  align,
  index,
  theme,
}: {
  align: 'left' | 'right';
  index: number;
  theme: { accent: string; shimmer: string };
}) {
  const isRight = align === 'right';
  return (
    <div
      className={`flex items-end gap-2 ${isRight ? 'flex-row-reverse' : 'flex-row'} mt-2`}
    >
      {!isRight && (
        <div
          className="h-[30px] w-[30px] rounded-full shrink-0"
          style={{
            background: `linear-gradient(110deg, #ececec 30%, ${theme.shimmer} 50%, #ececec 70%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
      <div
        className={`rounded-[18px] ${isRight ? 'rounded-br-[6px]' : 'rounded-bl-[6px]'}`}
        style={{
          width: SKELETON_WIDTHS[index % SKELETON_WIDTHS.length],
          height: 42,
          background: isRight
            ? `linear-gradient(110deg, ${theme.accent}15 30%, ${theme.accent}08 50%, ${theme.accent}15 70%)`
            : 'linear-gradient(110deg, #f0f0f0 30%, #fafafa 50%, #f0f0f0 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          animationDelay: `${index * 0.1}s`,
        }}
      />
    </div>
  );
}

/**
 * Full chat window — layout mirrors Facebook Messenger.
 *
 * ┌─────────────────────────────────────────┐
 * │  ChatHeader (participant + property)     │
 * ├─────────────────────────────────────────┤
 * │  Message list (scrollable)               │
 * │    ↑ infinite scroll (load older)        │
 * │    date separators                       │
 * │    MessageBubble × n                     │
 * │    TypingIndicator (if other is typing)  │
 * ├─────────────────────────────────────────┤
 * │  MessageInput (textarea + attach + send) │
 * └─────────────────────────────────────────┘
 */
export function ChatWindow({
  conversation,
  backHref,
  theme = CLIENT_THEME,
  initialDraft,
}: ChatWindowProps) {
  const { user } = useAuth();
  const otherParticipant = conversation.other_participant;
  const connectionState = useEchoConnectionState();
  const isReconnecting =
    connectionState === 'connecting' || connectionState === 'unavailable';

  const {
    messages,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
    sendMessage,
    uploadFile,
    deleteMessage,
    setReplyTo,
    replyTo,
    otherIsTyping,
    onlineStatus,
    presenceDevice,
    notifyTyping,
    markAsRead,
    queuedCount,
  } = useChat(conversation.uuid, otherParticipant?.id ?? '');

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isAtBottomRef = useRef(true);
  // Track which message UUIDs were present on initial load — only new ones animate
  const initialMsgIdsRef = useRef<Set<string> | null>(null);
  const initialLoadDoneRef = useRef(false);

  // Seed initial message set once loading finishes
  useEffect(() => {
    if (isLoading || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;
    initialMsgIdsRef.current = new Set(messages.map((m) => m.uuid));
  }, [isLoading, messages]);

  // ── Group messages by date ──────────────────────────────────────────────────
  const groups = useMemo(() => {
    const result: { date: string; messages: Message[] }[] = [];
    messages.forEach((msg) => {
      const date = msg.created_at.slice(0, 10);
      const last = result.at(-1);
      if (last?.date === date) {
        last.messages.push(msg);
      } else {
        result.push({ date, messages: [msg] });
      }
    });
    return result;
  }, [messages]);

  // ── Flatten groups into virtual items ───────────────────────────────────
  const flatItems = useMemo((): FlatItem[] => {
    const items: FlatItem[] = [];
    if (hasMore) items.push({ kind: 'load-more' });
    for (const group of groups) {
      items.push({ kind: 'separator', date: group.date });
      for (let i = 0; i < group.messages.length; i++) {
        const msg = group.messages[i];
        const prev = group.messages[i - 1];
        items.push({
          kind: 'message',
          msg,
          showAvatar: !prev || prev.sender_id !== msg.sender_id,
        });
      }
    }
    if (otherIsTyping && otherParticipant) items.push({ kind: 'typing' });
    return items;
  }, [groups, hasMore, otherIsTyping, otherParticipant]);

  // ── Virtualizer ──────────────────────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => {
      const item = flatItems[index];
      if (!item) return 72;
      switch (item.kind) {
        case 'load-more':
          return 44;
        case 'separator':
          return 36;
        case 'typing':
          return 52;
        case 'message': {
          const len = item.msg.body?.length ?? 0;
          if ((item.msg.attachments?.length ?? 0) > 0) return 200;
          if (len < 60) return 72;
          if (len < 160) return 100;
          return 140;
        }
      }
    },
    overscan: 12,
  });

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isAtBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setNewMsgCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    setNewMsgCount(0);
    if (flatItems.length > 0) {
      virtualizer.scrollToIndex(flatItems.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [flatItems.length, virtualizer]);

  const scrollToMessage = useCallback(
    (uuid: string) => {
      const idx = flatItems.findIndex(
        (item) => item.kind === 'message' && item.msg.uuid === uuid
      );
      if (idx >= 0)
        virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    },
    [flatItems, virtualizer]
  );

  // Auto mark-as-read on mount
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Auto-scroll + new-message counter
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    if (isAtBottomRef.current && flatItems.length > 0) {
      virtualizer.scrollToIndex(flatItems.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    } else {
      const newOnes = messages.filter(
        (m) => initialMsgIdsRef.current && !initialMsgIdsRef.current.has(m.uuid)
      );
      setNewMsgCount(newOnes.length);
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when typing indicator appears
  useEffect(() => {
    if (otherIsTyping && isAtBottomRef.current && flatItems.length > 0) {
      virtualizer.scrollToIndex(flatItems.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [otherIsTyping]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && flatItems.length > 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(flatItems.length - 1, { align: 'end' });
      });
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ backgroundColor: theme.chatBg }}
    >
      {/* Reconnect banner */}
      {isReconnecting && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-medium shrink-0"
          style={{
            backgroundColor: 'rgba(251,191,36,0.12)',
            borderBottom: '1px solid rgba(251,191,36,0.2)',
            color: '#92400e',
          }}
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Reconnexion en cours…</span>
        </div>
      )}

      {/* Header */}
      <ChatHeader
        conversation={conversation}
        presenceStatus={onlineStatus}
        presenceDevice={presenceDevice}
        backHref={backHref}
        theme={theme}
        onArchive={() => setShowArchiveConfirm(true)}
        onSearch={() => {
          setSearchOpen((o) => !o);
          setSearchQuery('');
        }}
        searchOpen={searchOpen}
      />

      {/* Search bar */}
      {searchOpen && (
        <div
          className="flex items-center gap-2 px-3 py-2 shrink-0"
          style={{
            borderBottom: `1px solid ${theme.glassBorder}`,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.03)',
          }}
        >
          <Search
            className="h-4 w-4 shrink-0"
            style={{ color: theme.accent }}
          />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher dans la conversation…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: theme.textPrimary } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="rounded-full p-0.5 transition-colors hover:bg-gray-200/50"
            >
              <X className="h-3.5 w-3.5" style={{ color: theme.textMuted }} />
            </button>
          )}
        </div>
      )}

      {/* Offline queue banner */}
      {queuedCount > 0 && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-1.5 text-[12px] font-medium shrink-0"
          style={{
            backgroundColor: 'rgba(251,191,36,0.12)',
            borderBottom: '1px solid rgba(251,191,36,0.2)',
            color: '#92400e',
          }}
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            {queuedCount} message{queuedCount > 1 ? 's' : ''} en attente · Envoi
            dès reconnexion
          </span>
        </div>
      )}

      {/* Archive confirmation banner */}
      {showArchiveConfirm && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] shrink-0"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${theme.glassBorder}`,
          }}
        >
          <span className="text-gray-700 font-medium">
            Archiver cette conversation ?
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchiveConfirm(false)}
              className="rounded-full px-3.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                setShowArchiveConfirm(false);
                await archiveConversation(conversation.uuid);
              }}
              className="rounded-full px-3.5 py-1 text-xs font-medium text-white transition-all active:scale-95"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 1px 4px ${theme.accent}30`,
              }}
            >
              Archiver
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {/* All animation keyframes — defined once, always in DOM */}
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fetchSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* ── Messages area: fixed watermark + scrollable list ───────── */}
      <div
        className="flex-1 relative min-h-0"
        style={{ backgroundColor: theme.chatBg }}
      >
        {/* Blurred logo watermark — stays fixed while messages scroll */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <Image
            src={theme.logoSrc}
            alt=""
            width={260}
            height={260}
            className="object-contain"
            style={{
              opacity: theme.isDark ? 0.13 : 0.11,
              filter: 'blur(3px)',
            }}
            aria-hidden
          />
        </div>

        {/* Scrollable messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 flex flex-col gap-0.5 overscroll-contain"
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col px-2 py-6 gap-0.5">
              {[0, 1, 0, 1, 0, 1, 1, 0].map((side, i) => (
                <MessageSkeleton
                  key={i}
                  align={side ? 'right' : 'left'}
                  index={i}
                  theme={theme}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* ── Empty conversation state ───────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 pb-10 px-6 select-none">
              {otherParticipant?.avatar ? (
                <Image
                  src={otherParticipant.avatar}
                  alt=""
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                  style={{ boxShadow: `0 4px 16px ${theme.accent}30` }}
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{
                    background: `linear-gradient(145deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
                    boxShadow: `0 4px 16px ${theme.accent}30`,
                  }}
                >
                  {otherParticipant?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div className="text-center">
                <p
                  className="text-[15px] font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  {otherParticipant?.name ?? 'Utilisateur'}
                </p>
                <p
                  className="text-[12.5px] mt-0.5"
                  style={{ color: theme.textMuted }}
                >
                  Démarrez la conversation
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px]"
                style={{
                  backgroundColor: theme.accentLight,
                  color: theme.accent,
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Envoyez votre premier message
              </div>
            </div>
          ) : (
            <>
              {/* Subtle background-refresh indicator */}
              {isFetching && (
                <div className="flex justify-center py-1.5">
                  <div
                    className="h-1 w-20 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${theme.accent}15` }}
                  >
                    <div
                      className="h-full w-1/2 rounded-full"
                      style={{
                        backgroundColor: theme.accent,
                        animation:
                          'fetchSlide 1s ease-in-out infinite alternate',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Virtualized message list */}
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const item = flatItems[vItem.index];
                  if (!item) return null;
                  return (
                    <div
                      key={vItem.key}
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
                      {item.kind === 'load-more' && (
                        <button
                          onClick={() => void loadMore()}
                          className="mx-auto flex items-center gap-1.5 text-[11px] font-medium py-2 px-4 rounded-full transition-colors"
                          style={{
                            color: theme.accent,
                            backgroundColor: theme.accentLight,
                          }}
                        >
                          <ChevronDown className="h-3 w-3 rotate-180" />
                          Messages précédents
                        </button>
                      )}
                      {item.kind === 'separator' && (
                        <DateSeparator date={item.date} theme={theme} />
                      )}
                      {item.kind === 'message' && (
                        <MessageBubble
                          message={item.msg}
                          isOwn={item.msg.sender_id === user?.id}
                          showAvatar={item.showAvatar}
                          isNew={
                            !!initialMsgIdsRef.current &&
                            !initialMsgIdsRef.current.has(item.msg.uuid)
                          }
                          recipientAvatar={otherParticipant?.avatar}
                          recipientName={otherParticipant?.name}
                          onReply={(m) => setReplyTo(m)}
                          onDelete={
                            item.msg.sender_id === user?.id
                              ? deleteMessage
                              : undefined
                          }
                          onScrollToReply={scrollToMessage}
                          theme={theme}
                          searchQuery={searchQuery || undefined}
                        />
                      )}
                      {item.kind === 'typing' && (
                        <TypingIndicator
                          name={otherParticipant!.name}
                          theme={theme}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {/* end messages-area wrapper */}

      {/* Scroll-to-bottom button + new message count pill */}
      {showScrollBtn && (
        <div className="absolute bottom-20 right-5 flex flex-col items-center gap-1.5 z-10">
          {newMsgCount > 0 && (
            <button
              onClick={scrollToBottom}
              className="rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-lg transition-all duration-200 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
                boxShadow: `0 2px 12px ${theme.accent}50`,
                animation: 'msgIn 0.2s cubic-bezier(0.34,1.36,0.64,1) both',
              }}
            >
              ↓ {newMsgCount} nouveau{newMsgCount > 1 ? 'x' : ''}
            </button>
          )}
          <button
            onClick={scrollToBottom}
            className="rounded-full p-2.5 transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px ${theme.glassBorder}`,
              color: theme.accent,
            }}
            aria-label="Défiler vers le bas"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onUpload={uploadFile}
        onTyping={notifyTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={isLoading}
        theme={theme}
        initialDraft={initialDraft}
      />
    </div>
  );
}
