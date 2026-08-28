'use client';

import type { Conversation, Message } from '@/types/chat';
import type { ChatTheme } from './chat-theme';
import { CLIENT_THEME } from './chat-theme';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import {
  archiveConversation,
  unarchiveConversation,
} from '@/lib/chat/chat-api';
import { getSafeErrorMessage } from '@/lib/error-messages';
import { chatKeys } from '@/lib/query-keys';
import { useEchoConnectionState } from '@/lib/chat/echo';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ChevronDown,
  MessageCircle,
  Search,
  WifiOff,
  X,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
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
  | { kind: 'activity'; mode: 'typing' | 'recording' };

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

/** Discreet single spinner shown only during a cold full sync (empty cache). */
function ColdSyncLoader({ theme }: { theme: ChatTheme }) {
  return (
    <div
      className="flex-1 flex items-center justify-center py-10"
      role="status"
      aria-label="Chargement des messages"
    >
      <div
        className="h-6 w-6 rounded-full animate-spin"
        style={{
          border: `2px solid ${theme.accent}33`,
          borderTopColor: theme.accent,
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const otherParticipant = conversation.other_participant;
  const connectionState = useEchoConnectionState();
  const isReconnecting =
    connectionState === 'connecting' || connectionState === 'unavailable';

  const {
    messages,
    isLoading,
    isMessagesError,
    refetchMessages,
    hasMore,
    loadMore,
    sendMessage,
    uploadFile,
    deleteMessage,
    toggleReaction,
    setReplyTo,
    replyTo,
    otherIsTyping,
    otherIsRecordingVoice,
    onlineStatus,
    presenceDevice,
    notifyTyping,
    stopTyping,
    setVoiceRecordingActive,
    markAsRead,
    queuedCount,
  } = useChat(conversation.uuid, otherParticipant?.id ?? '', conversation);

  const peerMessageActivityAt = useMemo(() => {
    if (!otherParticipant?.id) {
      return null;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.uuid.startsWith('__optimistic__')) {
        continue;
      }
      if (m.sender_id === otherParticipant.id) {
        return m.created_at;
      }
    }
    return null;
  }, [messages, otherParticipant?.id]);

  const listRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stickyDate, setStickyDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAtBottomRef = useRef(true);
  // Auto-pagination: an in-flight guard so the scroll handler never fires a
  // second load (runaway chain) while one is pending, plus the scroll metrics
  // captured just before a prepend so we can re-anchor the viewport after it.
  const isLoadingMoreRef = useRef(false);
  const prependAnchorRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  // Track which message UUIDs were present on initial load — only new ones animate
  const initialMsgIdsRef = useRef<Set<string> | null>(null);
  const initialLoadDoneRef = useRef(false);

  const handleUnarchive = useCallback(async () => {
    setUnarchiveError(null);
    setIsUnarchiving(true);
    try {
      await unarchiveConversation(conversation.uuid);
      await queryClient.invalidateQueries({
        queryKey: chatKeys.allConversations,
      });
      await queryClient.invalidateQueries({
        queryKey: ['conversation-single', conversation.uuid],
      });
    } catch (e) {
      setUnarchiveError(getSafeErrorMessage(e));
    } finally {
      setIsUnarchiving(false);
    }
  }, [conversation.uuid, queryClient]);

  useEffect(() => {
    initialLoadDoneRef.current = false;
    initialMsgIdsRef.current = null;
  }, [conversation.uuid, user?.id]);

  // Seed initial message set once loading finishes (per conversation)
  useEffect(() => {
    if (
      !user?.id ||
      isLoading ||
      isMessagesError ||
      initialLoadDoneRef.current
    ) {
      return;
    }
    initialLoadDoneRef.current = true;
    initialMsgIdsRef.current = new Set(messages.map((m) => m.uuid));
  }, [user?.id, conversation.uuid, isLoading, isMessagesError, messages]);

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
    if (otherIsRecordingVoice && otherParticipant) {
      items.push({ kind: 'activity', mode: 'recording' });
    } else if (otherIsTyping && otherParticipant) {
      items.push({ kind: 'activity', mode: 'typing' });
    }
    return items;
  }, [groups, hasMore, otherIsTyping, otherIsRecordingVoice, otherParticipant]);

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
        case 'activity':
          return 56;
        case 'message': {
          const textLen =
            (item.msg.decrypted_body ?? item.msg.body)?.length ?? 0;
          if ((item.msg.attachments?.length ?? 0) > 0) return 200;
          if (textLen < 60) return 72;
          if (textLen < 160) return 100;
          return 140;
        }
      }
    },
    overscan: 12,
  });

  // Pull the previous page of messages, keeping the manual "Messages
  // précédents" button as an accessible fallback. We snapshot the scroll
  // metrics before the prepend; a layout effect below restores the position so
  // the viewport stays anchored (WhatsApp-style) instead of jumping to the top.
  const triggerLoadMore = useCallback(async () => {
    const el = listRef.current;
    if (!el || !hasMore || isLoadingMoreRef.current) {
      return;
    }
    isLoadingMoreRef.current = true;
    prependAnchorRef.current = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
    };
    try {
      await loadMore();
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, loadMore]);

  // Track scroll position + compute sticky date label from the first visible item.
  // We walk the virtual items, find the first one whose offset is below the
  // current scrollTop, then look back to the most recent separator. This gives
  // us the date currently "in view" — perfect for a sticky pill that mirrors
  // WhatsApp / iMessage behaviour without a real CSS sticky header (which the
  // virtualizer's absolute positioning makes impossible).
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isAtBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setNewMsgCount(0);

    // Near the top (within ~1 viewport) of a scrollable list → auto-load the
    // previous page. The `isScrollable` check avoids firing on short threads
    // that don't fill the screen (there, the fallback button covers it), and
    // the in-flight ref inside `triggerLoadMore` blocks a runaway chain.
    const isScrollable = el.scrollHeight > el.clientHeight;
    if (hasMore && isScrollable && el.scrollTop < el.clientHeight) {
      void triggerLoadMore();
    }

    const virtualItems = virtualizer.getVirtualItems();
    if (virtualItems.length === 0) {
      setStickyDate(null);
    } else {
      const scrollTop = el.scrollTop;
      const firstVisibleIdx =
        virtualItems.find((vi) => vi.start + vi.size >= scrollTop)?.index ??
        virtualItems[0].index;
      let nextDate: string | null = null;
      for (let i = firstVisibleIdx; i >= 0; i--) {
        const item = flatItems[i];
        if (item?.kind === 'separator') {
          nextDate = item.date;
          break;
        }
      }
      setStickyDate(nextDate);
    }

    setIsScrolling(true);
    if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = setTimeout(() => setIsScrolling(false), 800);
  }, [flatItems, virtualizer, hasMore, triggerLoadMore]);

  // Cleanup the idle timer on unmount
  useEffect(
    () => () => {
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
    },
    []
  );

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

  // After a history prepend: restore the scroll position and fold the fetched
  // messages into the "known" set. Runs (as a layout effect, before paint) ahead
  // of the passive auto-scroll effect below, so the older messages we just
  // pulled are never mistaken for freshly-arrived ones by the unread counter,
  // and the viewport never flashes to the top. The virtualizer then corrects
  // any estimate-vs-measured drift of the prepended rows on its own.
  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current;
    if (!anchor) return;
    prependAnchorRef.current = null;

    const el = listRef.current;
    if (el) {
      const delta = el.scrollHeight - anchor.scrollHeight;
      if (delta > 0) el.scrollTop = anchor.scrollTop + delta;
    }

    if (initialMsgIdsRef.current) {
      for (const m of messages) initialMsgIdsRef.current.add(m.uuid);
    }
  }, [messages]);

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
    if (
      (otherIsTyping || otherIsRecordingVoice) &&
      isAtBottomRef.current &&
      flatItems.length > 0
    ) {
      virtualizer.scrollToIndex(flatItems.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [otherIsTyping, otherIsRecordingVoice]); // eslint-disable-line react-hooks/exhaustive-deps

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
        peerMessageActivityAt={peerMessageActivityAt}
        backHref={backHref}
        theme={theme}
        onArchive={() => {
          setArchiveError(null);
          setShowArchiveConfirm(true);
        }}
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
            className="flex-1 text-base md:text-sm bg-transparent outline-none"
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

      {/* Archived thread — restore to send again */}
      {conversation.status === 'archived' && (
        <div
          className="flex flex-col gap-2 px-4 py-2.5 text-[13px] shrink-0"
          style={{
            backgroundColor: 'rgba(251,191,36,0.12)',
            borderBottom: '1px solid rgba(251,191,36,0.25)',
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="font-medium" style={{ color: '#92400e' }}>
              Conversation archivée — restaurez-la pour envoyer des messages.
            </span>
            <button
              type="button"
              disabled={isUnarchiving}
              onClick={() => {
                void handleUnarchive();
              }}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 1px 4px ${theme.accent}30`,
              }}
            >
              {isUnarchiving ? 'Restauration…' : 'Restaurer'}
            </button>
          </div>
          {unarchiveError && (
            <p className="text-xs font-medium text-red-600">{unarchiveError}</p>
          )}
        </div>
      )}

      {/* Archive confirmation banner */}
      {showArchiveConfirm && (
        <div
          className="flex flex-col gap-2 px-4 py-2.5 text-[13px] shrink-0"
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: `1px solid ${theme.glassBorder}`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-700 font-medium">
              Archiver cette conversation ?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => {
                  setShowArchiveConfirm(false);
                  setArchiveError(null);
                }}
                className="rounded-full px-3.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => {
                  void (async () => {
                    if (isArchiving) {
                      return;
                    }
                    setIsArchiving(true);
                    setArchiveError(null);
                    try {
                      await archiveConversation(conversation.uuid);
                      setShowArchiveConfirm(false);
                      await queryClient.invalidateQueries({
                        queryKey: chatKeys.allConversations,
                      });
                      queryClient.removeQueries({
                        queryKey: ['conversation-single', conversation.uuid],
                      });
                      router.push(backHref ?? '/messages');
                    } catch (e) {
                      setArchiveError(getSafeErrorMessage(e));
                    } finally {
                      setIsArchiving(false);
                    }
                  })();
                }}
                className="rounded-full px-3.5 py-1 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                style={{
                  backgroundColor: theme.accent,
                  boxShadow: `0 1px 4px ${theme.accent}30`,
                }}
              >
                {isArchiving ? 'Archivage…' : 'Archiver'}
              </button>
            </div>
          </div>
          {archiveError && (
            <p className="text-xs font-medium text-red-600">{archiveError}</p>
          )}
        </div>
      )}

      {/* Messages */}
      {/* All animation keyframes — defined once, always in DOM */}
      <style>{`
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

        {/* Sticky day pill (WhatsApp / iMessage style).
            Fades in only while the user is actively scrolling, fades out 800 ms
            after they stop. Sits above the message list but below header banners. */}
        {stickyDate && (
          <div
            className="pointer-events-none absolute left-0 right-0 top-2 z-10 flex justify-center transition-opacity"
            style={{
              opacity: isScrolling ? 1 : 0,
              transitionDuration: '180ms',
              transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
            }}
            aria-hidden
          >
            <span
              className="text-[11px] font-medium px-3.5 py-1 rounded-full"
              style={{
                color: theme.textMuted,
                backgroundColor: theme.isDark
                  ? theme.surfaceBg
                  : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                boxShadow: theme.isDark
                  ? `0 1px 4px rgba(0,0,0,0.30), 0 0 0 1px ${theme.glassBorder}`
                  : '0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            >
              {(() => {
                const d = new Date(stickyDate);
                if (isToday(d)) return "Aujourd'hui";
                if (isYesterday(d)) return 'Hier';
                return format(d, 'dd MMMM yyyy', { locale: fr });
              })()}
            </span>
          </div>
        )}

        {/* Scrollable messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 py-3 flex flex-col gap-0.5 overscroll-contain"
        >
          {isLoading ? (
            <ColdSyncLoader theme={theme} />
          ) : isMessagesError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-10 px-6 text-center max-w-sm mx-auto">
              <AlertCircle
                className="h-12 w-12 shrink-0"
                style={{ color: theme.accent }}
                aria-hidden
              />
              <div>
                <p
                  className="text-[15px] font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  Impossible de charger les messages
                </p>
                <p
                  className="text-[12.5px] mt-1.5"
                  style={{ color: theme.textMuted }}
                >
                  Vérifiez votre connexion ou réessayez dans un instant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchMessages()}
                className="rounded-full px-5 py-2.5 text-[13px] font-medium min-h-11 min-w-[140px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: theme.accent,
                  color: '#fff',
                  outlineColor: theme.accent,
                }}
              >
                Réessayer
              </button>
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
              {/*
                No background-refresh indicator here: this branch only renders
                once messages are present, and silent revalidation must stay
                invisible when data is already shown (WhatsApp-Web behaviour).
                The first-fetch-without-cache wait is covered by the `isLoading`
                skeleton above.
              */}

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
                          onToggleReaction={toggleReaction}
                          currentUserId={user?.id}
                          onScrollToReply={scrollToMessage}
                          theme={theme}
                          searchQuery={searchQuery || undefined}
                        />
                      )}
                      {item.kind === 'activity' && (
                        <TypingIndicator
                          name={otherParticipant!.name}
                          theme={theme}
                          variant={item.mode}
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
                animation: 'msgIn 0.2s cubic-bezier(0.22,1,0.36,1) both',
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
        stopTyping={stopTyping}
        setVoiceRecordingActive={setVoiceRecordingActive}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        disabled={isLoading || conversation.status === 'archived'}
        theme={theme}
        conversationUuid={conversation.uuid}
        initialDraft={initialDraft}
      />
    </div>
  );
}
