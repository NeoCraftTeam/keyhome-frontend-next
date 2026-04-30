'use client';

import { KeyHomeChatBox } from '@/components/chat/KeyHomeChatBox';
import { use } from 'react';
import { useSearchParams } from 'next/navigation';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

/**
 * /messages/[uuid] — Deep link into a specific conversation.
 * ChatBox handles the full layout (list + thread).
 * Accepts ?draft= to pre-fill the message input (used by the ad detail CTA).
 */
export default function ConversationPage({ params }: PageProps) {
  const { uuid } = use(params);
  const searchParams = useSearchParams();
  const initialDraft = searchParams.get('draft') ?? undefined;

  return (
    <KeyHomeChatBox
      initialActiveConversationId={uuid}
      initialDraft={initialDraft}
      backHref="/home"
    />
  );
}
