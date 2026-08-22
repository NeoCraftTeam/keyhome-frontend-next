'use client';

import type { ChatTheme } from '@/components/chat/chat-theme';
import {
  CLIENT_DARK_THEME,
  CLIENT_THEME,
  OWNER_DARK_THEME,
  OWNER_THEME,
} from '@/components/chat/chat-theme';
import { useConversations } from '@/hooks/useConversations';
import { fetchConversation } from '@/lib/chat/chat-api';
import { useOwnerTheme } from '@/providers/OwnerThemeProvider';
import { useThemeMode } from '@/providers/ThemeProvider';
import { useMediaQuery, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { useMemo } from 'react';
import { ChatWindow } from './ChatWindow';
import { ConversationList } from './ConversationList';

/** Sidebar width on desktop (px). */
const SIDEBAR_W = 320;

// ─── Props ──────────────────────────────────────────────────────────────────
interface KeyHomeChatBoxProps {
  /**
   * Active conversation (controlled — from the /messages/[uuid] URL segment).
   * Re-read on every render so switching conversations swaps the thread pane
   * without remounting the list or the shell.
   */
  activeConversationId?: string;
  /** @deprecated alias de `activeConversationId`, conservé le temps de migrer les appelants. */
  initialActiveConversationId?: string;
  /** Visual theme — defaults to client pink */
  theme?: ChatTheme;
  /** URL prefix for navigation — /messages or /owner/messages */
  basePath?: string;
  /** Back button href shown in the conversation list header */
  backHref?: string;
  /** Pre-filled draft text for the message input (seeds the draft if empty). */
  initialDraft?: string;
}

// ─── Desktop empty state ─────────────────────────────────────────────────────
function ChatEmptyState({ theme }: { theme: ChatTheme }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-5 min-h-0 relative overflow-hidden"
      style={{ backgroundColor: theme.chatBg }}
    >
      {/* Blurred logo watermark — same treatment as ChatWindow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <Image
          src={theme.logoSrc}
          alt=""
          width={260}
          height={260}
          className="object-contain"
          style={{ opacity: theme.isDark ? 0.07 : 0.09, filter: 'blur(3px)' }}
          aria-hidden
        />
      </div>

      {/* Foreground content */}
      <div className="relative flex flex-col items-center gap-5">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.bubbleGradientEnd})`,
            boxShadow: `0 8px 24px ${theme.accent}35`,
          }}
        >
          <MessageSquare className="h-7 w-7 text-white" />
        </div>
        <div className="text-center px-8">
          <p
            className="text-[15px] font-semibold mb-1.5"
            style={{ color: theme.textPrimary }}
          >
            Vos messages
          </p>
          <p
            className="text-[12.5px] leading-relaxed max-w-[210px]"
            style={{ color: theme.textMuted }}
          >
            Sélectionnez une conversation pour afficher les messages.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium"
          style={{ backgroundColor: theme.accentLight, color: theme.accent }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: theme.accent }}
          />
          Choisissez une conversation
        </div>
      </div>
    </div>
  );
}

// ─── Thread scaffold ─────────────────────────────────────────────────────────
/**
 * Squelette du fil (header + bulles + barre de saisie) affiché pendant la
 * résolution d'une conversation en deep-link, à la place d'un spinner centré.
 * Dimensionné comme le rendu final → aucun layout shift façon WhatsApp Web.
 */
function ChatThreadScaffold({ theme }: { theme: ChatTheme }) {
  const bubble = (mine: boolean, width: number, key: number) => (
    <div
      key={key}
      className="flex"
      style={{ justifyContent: mine ? 'flex-end' : 'flex-start' }}
    >
      <div
        className="rounded-2xl animate-pulse"
        style={{
          width,
          height: 34,
          backgroundColor: mine ? theme.accentLight : theme.inputBg,
        }}
      />
    </div>
  );

  return (
    <div
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
      style={{ backgroundColor: theme.chatBg }}
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${theme.glassBorder}` }}
      >
        <div
          className="h-10 w-10 rounded-full animate-pulse"
          style={{ backgroundColor: theme.inputBg }}
        />
        <div className="flex flex-col gap-1.5">
          <div
            className="h-3 w-32 rounded animate-pulse"
            style={{ backgroundColor: theme.inputBg }}
          />
          <div
            className="h-2.5 w-20 rounded animate-pulse"
            style={{ backgroundColor: theme.inputBg }}
          />
        </div>
      </div>

      {/* Bubble skeletons */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-4 overflow-hidden">
        {bubble(false, 180, 0)}
        {bubble(true, 120, 1)}
        {bubble(false, 220, 2)}
        {bubble(true, 90, 3)}
        {bubble(false, 150, 4)}
      </div>

      {/* Input bar skeleton */}
      <div
        className="shrink-0 px-3 py-2.5"
        style={{ borderTop: `1px solid ${theme.glassBorder}` }}
      >
        <div
          className="h-[42px] w-full rounded-2xl animate-pulse"
          style={{ backgroundColor: theme.inputBg }}
        />
      </div>
    </div>
  );
}

/**
 * KeyHome P2P chat layout — works for both client and owner panels.
 *
 * Architecture:
 * - Uses the custom ConversationList + ChatWindow stack (P2P-native with WebSocket).
 * - Desktop (≥ md): fixed 320 px sidebar (ConversationList) + flex-1 thread (ChatWindow).
 * - Mobile (< md): full-screen list OR full-screen window depending on active UUID.
 *
 * `activeConversationId` is controlled: it comes from the URL segment via the
 * persistent messages layout, so switching conversations swaps only the thread
 * pane (keyed by uuid) — the list and the shell never remount.
 *
 * Why NOT @mui/x-chat ChatBox:
 * - MUI X Chat is designed for AI/LLM streaming responses. sendMessage must return
 *   a ReadableStream of tokens. For P2P this stream is always empty, which causes
 *   the component to add phantom empty "assistant" messages after every send and
 *   produces broken UI states. The custom stack avoids this entirely.
 */
export function KeyHomeChatBox({
  activeConversationId,
  initialActiveConversationId,
  theme: themeProp,
  basePath = '/messages',
  backHref,
  initialDraft,
}: KeyHomeChatBoxProps) {
  // Controlled prop wins; fall back to the deprecated alias for un-migrated callers.
  const activeId = activeConversationId ?? initialActiveConversationId;

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { mode } = useThemeMode();
  // If no explicit theme is provided, auto-select based on global dark mode.
  const theme =
    themeProp ?? (mode === 'dark' ? CLIENT_DARK_THEME : CLIENT_THEME);
  const { conversations, isLoading: convLoading } = useConversations();

  // Try to resolve the active conversation from the TanStack cache first.
  const cachedConversation = useMemo(
    () =>
      activeId ? conversations.find((c) => c.uuid === activeId) : undefined,
    [conversations, activeId]
  );

  // Fallback: fetch directly when deep-linking to /messages/[uuid] before the
  // conversation list has loaded (e.g. fresh page load or browser back/forward).
  const { data: fetchedConversation, isError: fetchError } = useQuery({
    queryKey: ['conversation-single', activeId],
    queryFn: () => fetchConversation(activeId!),
    enabled: !!activeId && !cachedConversation && !convLoading,
    staleTime: 5 * 60 * 1000,
  });

  const activeConversation = cachedConversation ?? fetchedConversation;
  // Show the thread scaffold whenever a conversation is targeted but not yet
  // resolved — while the list loads OR the fallback fetch runs. On fetch error
  // (unreachable deep-link) we fall back to the list/empty-state instead.
  const showScaffold = !!activeId && !activeConversation && !fetchError;

  // ─── Mobile layout: list OR window full-screen ───────────────────────────
  let mobileContent: React.ReactNode;
  if (activeConversation) {
    mobileContent = (
      <ChatWindow
        key={activeConversation.uuid}
        conversation={activeConversation}
        backHref={basePath}
        theme={theme}
        initialDraft={initialDraft}
      />
    );
  } else if (showScaffold) {
    mobileContent = <ChatThreadScaffold theme={theme} />;
  } else {
    mobileContent = (
      <ConversationList
        activeUuid={activeId}
        basePath={basePath}
        theme={theme}
        backHref={backHref}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {mobileContent}
      </div>
    );
  }

  // ─── Desktop layout: sidebar + thread (split-pane) ───────────────────────
  return (
    <div className="absolute inset-0 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className="flex flex-col min-h-0 shrink-0 overflow-hidden"
        style={{
          width: SIDEBAR_W,
          borderRight: `1px solid ${theme.glassBorder}`,
        }}
      >
        <ConversationList
          activeUuid={activeId}
          basePath={basePath}
          theme={theme}
          backHref={backHref}
        />
      </div>

      {/* Thread pane */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.uuid}
            conversation={activeConversation}
            theme={theme}
            backHref={basePath}
            initialDraft={initialDraft}
          />
        ) : showScaffold ? (
          <ChatThreadScaffold theme={theme} />
        ) : (
          <ChatEmptyState theme={theme} />
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured chat layout for the owner/bailleur panel (teal theme).
 * Automatically switches to OWNER_DARK_THEME when global dark mode is active.
 */
export function OwnerChatBox({
  activeConversationId,
  initialActiveConversationId,
  initialDraft,
}: {
  activeConversationId?: string;
  /** @deprecated alias de `activeConversationId`. */
  initialActiveConversationId?: string;
  initialDraft?: string;
}) {
  const { mode } = useOwnerTheme();
  const ownerTheme = mode === 'dark' ? OWNER_DARK_THEME : OWNER_THEME;
  return (
    <KeyHomeChatBox
      activeConversationId={activeConversationId ?? initialActiveConversationId}
      initialDraft={initialDraft}
      theme={ownerTheme}
      basePath="/owner/messages"
      backHref="/owner/dashboard"
    />
  );
}
