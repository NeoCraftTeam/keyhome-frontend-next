import type { Conversation } from '@/types/chat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ConversationItem — navigation « statique comme WhatsApp » :
 *  - au survol / touch, on préchauffe le segment de route Next (`router.prefetch`)
 *    ET le cache de messages, pour un rendu instantané du fil à l'arrivée ;
 *  - la navigation passe `scroll: false` pour que la coquille persistante ne
 *    saute pas en haut de page.
 */

const router = vi.hoisted(() => ({
  push: vi.fn(),
  prefetch: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, alt, ...rest } = props;
    void fill;
    void priority;
    return <img alt={(alt as string) ?? ''} {...(rest as object)} />;
  },
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'me' } }),
}));

const prefetchChatMessages = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useChat', () => ({
  prefetchChatMessages,
  chatMessagesKey: (userId: string, uuid: string) => [
    'chat-messages',
    userId,
    uuid,
  ],
}));

vi.mock('@/hooks/useChatMessagesCacheEntry', () => ({
  useChatMessagesCacheEntry: () => undefined,
}));

// StatusIcon vient de MessageBubble (lourd) — on l'isole.
vi.mock('@/components/chat/MessageBubble', () => ({
  StatusIcon: () => null,
}));

import { ConversationItem } from '@/components/chat/ConversationItem';

const conversation = {
  uuid: 'conv-9',
  unread_count: 0,
  status: 'active',
  other_participant: { id: 'peer', name: 'Bob' },
  last_message: null,
  last_message_at: null,
} as unknown as Conversation;

function renderItem(basePath = '/messages'): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui: ReactElement = (
    <QueryClientProvider client={client}>
      <ConversationItem
        conversation={conversation}
        isActive={false}
        basePath={basePath}
      />
    </QueryClientProvider>
  );
  return render(ui);
}

describe('ConversationItem — préchauffage & navigation', () => {
  beforeEach(() => {
    router.push.mockClear();
    router.prefetch.mockClear();
    prefetchChatMessages.mockClear();
  });

  afterEach(cleanup);

  it('préchauffe la route ET le cache de messages au survol', () => {
    const { getByRole } = renderItem();

    fireEvent.mouseEnter(getByRole('link'));

    expect(router.prefetch).toHaveBeenCalledWith('/messages/conv-9');
    expect(prefetchChatMessages).toHaveBeenCalledTimes(1);
  });

  it('ne préchauffe le cache de messages qu’une seule fois', () => {
    const { getByRole } = renderItem();
    const row = getByRole('link');

    fireEvent.mouseEnter(row);
    fireEvent.mouseEnter(row);
    fireEvent.mouseEnter(row);

    expect(prefetchChatMessages).toHaveBeenCalledTimes(1);
  });

  it('navigue avec scroll:false pour ne pas faire sauter la coquille', () => {
    const { getByRole } = renderItem();

    fireEvent.click(getByRole('link'));

    expect(router.push).toHaveBeenCalledWith('/messages/conv-9', {
      scroll: false,
    });
  });

  it('respecte basePath (bailleur) pour prefetch et navigation', () => {
    const { getByRole } = renderItem('/owner/messages');
    const row = getByRole('link');

    fireEvent.mouseEnter(row);
    fireEvent.click(row);

    expect(router.prefetch).toHaveBeenCalledWith('/owner/messages/conv-9');
    expect(router.push).toHaveBeenCalledWith('/owner/messages/conv-9', {
      scroll: false,
    });
  });
});
