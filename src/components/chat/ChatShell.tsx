'use client';

import { KeyHomeChatBox, OwnerChatBox } from '@/components/chat/KeyHomeChatBox';
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
 */
export default function ChatShell({ variant = 'client' }: ChatShellProps) {
  // null on the inbox (/messages), the [uuid] value on /messages/[uuid].
  const segment = useSelectedLayoutSegment();
  const searchParams = useSearchParams();

  const activeConversationId = segment ?? undefined;
  const initialDraft = searchParams.get('draft') ?? undefined;

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
