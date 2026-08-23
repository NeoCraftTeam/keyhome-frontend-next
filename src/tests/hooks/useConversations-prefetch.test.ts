import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const { prefetchChatMessages, fetchConversations, fetchUnreadCount } =
  vi.hoisted(() => ({
    prefetchChatMessages: vi.fn(),
    fetchConversations: vi.fn(),
    fetchUnreadCount: vi.fn(),
  }));

// Mock the whole chat stack away — the hook only needs `prefetchChatMessages`.
vi.mock('@/hooks/useChat', () => ({ prefetchChatMessages }));
vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));
vi.mock('@/lib/chat/chat-subscriptions', () => ({
  // Identity select so slice order is deterministic in the assertion.
  selectConversationsForBackgroundWs: (c: unknown[]) => c,
}));
vi.mock('@/lib/chat/chat-api', () => ({
  fetchConversations,
  fetchUnreadCount,
}));

import { useConversations } from '@/hooks/useConversations';

function makeConversations(n: number): Array<{ uuid: string }> {
  return Array.from({ length: n }, (_, i) => ({ uuid: `c${i}` }));
}

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useConversations — proactive message prefetch', () => {
  it('warms the message cache for the top 8 conversations on first load', async () => {
    fetchConversations.mockResolvedValue({ data: makeConversations(20) });
    fetchUnreadCount.mockResolvedValue({ total_unread: 0 });

    renderHook(() => useConversations(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(prefetchChatMessages).toHaveBeenCalledTimes(8);
    });
    expect(prefetchChatMessages).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'u1',
      'c0'
    );
    expect(prefetchChatMessages).toHaveBeenNthCalledWith(
      8,
      expect.anything(),
      'u1',
      'c7'
    );
  });

  it('warms only what exists when there are fewer than 8 conversations', async () => {
    fetchConversations.mockResolvedValue({ data: makeConversations(3) });
    fetchUnreadCount.mockResolvedValue({ total_unread: 0 });

    renderHook(() => useConversations(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(prefetchChatMessages).toHaveBeenCalledTimes(3);
    });
  });

  it('prefetches a single burst, not on every render', async () => {
    fetchConversations.mockResolvedValue({ data: makeConversations(10) });
    fetchUnreadCount.mockResolvedValue({ total_unread: 0 });

    const { rerender } = renderHook(() => useConversations(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(prefetchChatMessages).toHaveBeenCalledTimes(8);
    });
    rerender();
    expect(prefetchChatMessages).toHaveBeenCalledTimes(8);
  });
});
