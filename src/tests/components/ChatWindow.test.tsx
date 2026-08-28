import type { Conversation, Message } from '@/types/chat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
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
    // …et pourtant aucun loader de chargement n'est rendu.
    expect(
      container.querySelector('[aria-label="Chargement des messages"]')
    ).toBeNull();
  });

  it('montre un loader discret au tout premier fetch sans cache (isLoading)', () => {
    chatState.current = buildState({
      messages: [],
      isLoading: true,
      isFetching: true,
    });

    const { container } = renderWindow();

    // Plus de fausse liste de bulles-squelette : un unique spinner « cold sync ».
    expect(
      container.querySelector('[aria-label="Chargement des messages"]')
    ).not.toBeNull();
  });
});

/**
 * Auto-pagination — la remontée déclenche `loadMore()` près du haut d'une liste
 * défilable, sans jamais redéclencher tant qu'un chargement est en cours (le
 * bouton « Messages précédents » restant le repli accessible).
 *
 * jsdom n'a pas de layout : on injecte scrollHeight/clientHeight/scrollTop sur
 * le conteneur défilant puis on émet l'événement `scroll`.
 */
function defineScrollMetrics(
  el: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number }
): void {
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
}

function getScroller(container: HTMLElement): HTMLElement {
  const el = container.querySelector('.overflow-y-auto');
  if (!el) throw new Error('conteneur défilant introuvable');
  return el as HTMLElement;
}

describe('ChatWindow — auto-pagination', () => {
  afterEach(cleanup);

  it('déclenche loadMore à proximité du haut d’une liste défilable', () => {
    // Promesse jamais résolue → le garde-fou « en cours » reste actif.
    const loadMore = vi.fn(() => new Promise<void>(() => {}));
    chatState.current = buildState({
      messages: [message],
      hasMore: true,
      loadMore,
    });

    const { container } = renderWindow();
    const scroller = getScroller(container);
    defineScrollMetrics(scroller, {
      scrollHeight: 1000,
      clientHeight: 500,
      scrollTop: 100,
    });

    fireEvent.scroll(scroller);

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('ne redéclenche pas loadMore tant que le chargement est en cours', () => {
    const loadMore = vi.fn(() => new Promise<void>(() => {}));
    chatState.current = buildState({
      messages: [message],
      hasMore: true,
      loadMore,
    });

    const { container } = renderWindow();
    const scroller = getScroller(container);
    defineScrollMetrics(scroller, {
      scrollHeight: 1000,
      clientHeight: 500,
      scrollTop: 100,
    });

    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche pas loadMore loin du haut', () => {
    const loadMore = vi.fn(() => new Promise<void>(() => {}));
    chatState.current = buildState({
      messages: [message],
      hasMore: true,
      loadMore,
    });

    const { container } = renderWindow();
    const scroller = getScroller(container);
    defineScrollMetrics(scroller, {
      scrollHeight: 1000,
      clientHeight: 500,
      scrollTop: 800,
    });

    fireEvent.scroll(scroller);

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('ne déclenche pas loadMore quand il n’y a plus de page (hasMore=false)', () => {
    const loadMore = vi.fn(() => new Promise<void>(() => {}));
    chatState.current = buildState({
      messages: [message],
      hasMore: false,
      loadMore,
    });

    const { container } = renderWindow();
    const scroller = getScroller(container);
    defineScrollMetrics(scroller, {
      scrollHeight: 1000,
      clientHeight: 500,
      scrollTop: 100,
    });

    fireEvent.scroll(scroller);

    expect(loadMore).not.toHaveBeenCalled();
  });

  it('ne déclenche pas loadMore sur une liste non défilable (thread court)', () => {
    const loadMore = vi.fn(() => new Promise<void>(() => {}));
    chatState.current = buildState({
      messages: [message],
      hasMore: true,
      loadMore,
    });

    const { container } = renderWindow();
    const scroller = getScroller(container);
    // scrollHeight <= clientHeight → rien à faire défiler.
    defineScrollMetrics(scroller, {
      scrollHeight: 400,
      clientHeight: 500,
      scrollTop: 0,
    });

    fireEvent.scroll(scroller);

    expect(loadMore).not.toHaveBeenCalled();
  });
});
