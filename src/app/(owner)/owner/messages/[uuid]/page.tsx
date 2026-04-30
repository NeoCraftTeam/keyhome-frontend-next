'use client';

import { OwnerChatBox } from '@/components/chat/KeyHomeChatBox';
import { use } from 'react';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

/**
 * /owner/messages/[uuid] — Deep link into a specific owner conversation.
 */
export default function OwnerConversationPage({ params }: PageProps) {
  const { uuid } = use(params);

  return <OwnerChatBox initialActiveConversationId={uuid} />;
}
