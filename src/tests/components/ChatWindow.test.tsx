import type { Conversation, Message } from '@/types/chat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ChatWindow — garde-fous « statique comme WhatsApp » :
 *  - aucune barre de rafraîchissement (`isFetching`) quand des messages sont
 *    déjà affichés (révalidation silencieuse invisible) ;
 *  - le squelette `isLoading` reste, lui, pour le tout premier fetch sans cache.
 *
 * ChatWindow tire beaucoup de dépendances (WebSocket, virtualizer, enfants
 * lourds). On les mocke pour isoler la logique d'affichage : le virtualizer
 * ne rend aucune ligne en jsdom (pas de layout), mais la barre `isFetching`
 * est rendue HORS de la liste virtualisée, donc ce mock suffit à la tester.
 */

// next/image → <img> simple
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, alt, ...rest } = props;
    void fill;
    void priority;
    return <img alt={(alt as string) ?? ''} {...(rest as object)} />;
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'me' } }),
}));

vi.mock('@/lib/chat/echo', () => ({
  useEchoConnectionState: () => 'connected',
}));

vi.mock('@/lib/chat/chat-api', () => ({
  archiveConversation: vi.fn(),
  unarchiveConversation: vi.fn(),
}));

// Pas de layout en jsdom → aucune ligne virtualisée. La barre isFetching est
// rendue hors de cette liste, donc on peut la tester malgré tout.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}));

// Enfants lourds → surface de rendu réduite.
vi.mock('@/components/chat/ChatHeader', () => ({
  ChatHeader: () => <div data-testid="chat-header" />,
}));
vi.mock('@/components/chat/MessageBubble', () => ({
  MessageBubble: () => <div data-testid="message-bubble" />,
}));
vi.mock('@/components/chat/MessageInput', () => ({
  MessageInput: () => <div data-testid="message-input" />,
}));
vi.mock('@/components/chat/TypingIndicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator" />,
}));

const chatState = vi.hoisted(() => ({
  current: null as ReturnType<typeof buildState> | null,
}));

vi.mock('@/hooks/useChat', () => ({
  useChat: () => chatState.current,
}));

import { ChatWindow } from '@/components/chat/ChatWindow';

function buildState(overrides: Record<string, unknown> = {}) {
  return {
    messages: [] as Message[],
    isLoading: false,
    isFetching: false,
    isMessagesError: false,
    refetchMessages: vi.fn(),
    hasMore: false,
    loadMore: vi.fn(),
    sendMessage: vi.fn(),
    uploadFile: vi.fn(),
    deleteMessage: vi.fn(),
    toggleReaction: vi.fn(),
    setReplyTo: vi.fn(),
    replyTo: null,
    otherIsTyping: false,
    otherIsRecordingVoice: false,
    onlineStatus: null,
    presenceDevice: null,
    notifyTyping: vi.fn(),
    stopTyping: vi.fn(),
    setVoiceRecordingActive: vi.fn(),
    markAsRead: vi.fn(),
    queuedCount: 0,
    ...overrides,
  };
}

const conversation = {
  uuid: 'conv-1',
  status: 'active',
  other_participant: { id: 'peer', name: 'Alice' },
} as unknown as Conversation;

const message = {
  uuid: 'm1',
  sender_id: 'peer',
  created_at: '2026-08-21T10:00:00.000Z',
  body: 'Bonjour',
} as unknown as Message;

function renderWindow(): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const ui: ReactElement = (
    <QueryClientProvider client={client}>
      <ChatWindow conversation={conversation} />
    </QueryClientProvider>
  );
  return render(ui);
}

describe('ChatWindow — indicateurs de chargement', () => {
  beforeEach(() => {
    chatState.current = buildState();
  });

  afterEach(cleanup);

  it('ne montre AUCUN indicateur de rafraîchissement quand des messages sont déjà affichés', () => {
    chatState.current = buildState({
      messages: [message],
      isFetching: true,
      isLoading: false,
    });

    const { container, getByTestId } = renderWindow();

    // On est bien dans la branche « messages affichés » (input présent)…
    expect(getByTestId('message-input')).toBeInTheDocument();
    // …et pourtant aucune barre/squelette de chargement n'est rendue.
    expect(container.querySelector('[data-kh-chat-skeleton]')).toBeNull();
  });

  it('garde le squelette au tout premier fetch sans cache (isLoading)', () => {
    chatState.current = buildState({
      messages: [],
      isLoading: true,
      isFetching: true,
    });

    const { container } = renderWindow();

    expect(container.querySelector('[data-kh-chat-skeleton]')).not.toBeNull();
  });
});
