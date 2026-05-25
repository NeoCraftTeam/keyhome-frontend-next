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
import { CircularProgress, useMediaQuery, useTheme } from '@mui/material';
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
  /** Pre-select a conversation (e.g. from /messages/[uuid]) */
  initialActiveConversationId?: string;
  /** Visual theme — defaults to client pink */
  theme?: ChatTheme;
  /** URL prefix for navigation — /messages or /owner/messages */
  basePath?: string;
  /** Back button href shown in the conversation list header */
  backHref?: string;
  /** Pre-filled draft text for the message input (applied once on mount). */
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

// ─── Spinner helper ──────────────────────────────────────────────────────────
function ChatLoadingState({ theme }: { theme: ChatTheme }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-0">
      <CircularProgress size={28} sx={{ color: theme.accent }} />
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
 * Why NOT @mui/x-chat ChatBox:
 * - MUI X Chat is designed for AI/LLM streaming responses. sendMessage must return
 *   a ReadableStream of tokens. For P2P this stream is always empty, which causes
 *   the component to add phantom empty "assistant" messages after every send and
 *   produces broken UI states. The custom stack avoids this entirely.
 */
export function KeyHomeChatBox({
  initialActiveConversationId,
  theme: themeProp,
  basePath = '/messages',
  backHref,
  initialDraft,
}: KeyHomeChatBoxProps) {
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
      initialActiveConversationId
        ? conversations.find((c) => c.uuid === initialActiveConversationId)
        : undefined,
    [conversations, initialActiveConversationId]
  );

  // Fallback: fetch directly when deep-linking to /messages/[uuid] before the
  // conversation list has loaded (e.g. fresh page load or browser back/forward).
  const { data: fetchedConversation, isLoading: fetchLoading } = useQuery({
    queryKey: ['conversation-single', initialActiveConversationId],
    queryFn: () => fetchConversation(initialActiveConversationId!),
    enabled:
      !!initialActiveConversationId && !cachedConversation && !convLoading,
    staleTime: 5 * 60 * 1000,
  });

  const activeConversation = cachedConversation ?? fetchedConversation;
  const isLoadingActive =
    !!initialActiveConversationId && !activeConversation && fetchLoading;

  // ─── Mobile layout: list OR window full-screen ───────────────────────────
  if (isMobile) {
    let mobileContent: React.ReactNode;
    if (initialActiveConversationId) {
      if (isLoadingActive) {
        mobileContent = <ChatLoadingState theme={theme} />;
      } else if (activeConversation) {
        mobileContent = (
          <ChatWindow
            conversation={activeConversation}
            backHref={basePath}
            theme={theme}
            initialDraft={initialDraft}
          />
        );
      } else {
        mobileContent = (
          <ConversationList
            activeUuid={initialActiveConversationId}
            basePath={basePath}
            theme={theme}
            backHref={backHref}
          />
        );
      }
    } else {
      mobileContent = (
        <ConversationList
          activeUuid={initialActiveConversationId}
          basePath={basePath}
          theme={theme}
          backHref={backHref}
        />
      );
    }

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
          activeUuid={initialActiveConversationId}
          basePath={basePath}
          theme={theme}
          backHref={backHref}
        />
      </div>

      {/* Thread pane */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        {isLoadingActive ? (
          <ChatLoadingState theme={theme} />
        ) : activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            theme={theme}
            backHref={basePath}
            initialDraft={initialDraft}
          />
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
  initialActiveConversationId,
}: {
  initialActiveConversationId?: string;
}) {
  const { mode } = useOwnerTheme();
  const ownerTheme = mode === 'dark' ? OWNER_DARK_THEME : OWNER_THEME;
  return (
    <KeyHomeChatBox
      initialActiveConversationId={initialActiveConversationId}
      theme={ownerTheme}
      basePath="/owner/messages"
      backHref="/owner/dashboard"
    />
  );
}
