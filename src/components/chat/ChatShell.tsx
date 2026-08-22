'use client';

import ChatShellScaffold from '@/components/chat/ChatShellScaffold';
import { KeyHomeChatBox, OwnerChatBox } from '@/components/chat/KeyHomeChatBox';
import { useIsRestoring } from '@tanstack/react-query';
import { useSearchParams, useSelectedLayoutSegment } from 'next/navigation';

interface ChatShellProps {
  /** Which panel this shell drives — client (pink) or owner (teal). */
  variant?: 'client' | 'owner';
}

/**
 * Persistent chat shell mounted by the `messages` layout.
 *
 * The layout persists across `/messages` ↔ `/messages/[uuid]` navigations, so
 * this component (and the whole chat box below it — list + WebSocket) mounts
 * once and never unmounts while the user stays in the messages section. That is
 * what makes navigation feel instant, WhatsApp-Web style.
 *
 * The active conversation is derived from the URL segment (re-read on every
 * render), NOT captured once at mount, so switching conversations swaps only
 * the thread pane. `?draft=` is passed through for the ad-detail "contact" CTA.
 *
 * While the persisted query cache is still being restored from storage
 * (`useIsRestoring()`), we render a shell-shaped scaffold instead of mounting
 * the chat box against an empty cache — that avoids a cold-load skeleton flash
 * and, once restore completes, the box mounts against a warm cache with zero
 * layout shift. This only affects the very first cold load; soft navigations
 * already have the cache in memory.
 */
export default function ChatShell({ variant = 'client' }: ChatShellProps) {
  const isRestoring = useIsRestoring();

  // null on the inbox (/messages), the [uuid] value on /messages/[uuid].
  const segment = useSelectedLayoutSegment();
  const searchParams = useSearchParams();

  const activeConversationId = segment ?? undefined;
  const initialDraft = searchParams.get('draft') ?? undefined;

  if (isRestoring) {
    return <ChatShellScaffold variant={variant} />;
  }

  if (variant === 'owner') {
    return (
      <OwnerChatBox
        activeConversationId={activeConversationId}
        initialDraft={initialDraft}
      />
    );
  }

  return (
    <KeyHomeChatBox
      activeConversationId={activeConversationId}
      initialDraft={initialDraft}
      backHref="/home"
    />
  );
}
