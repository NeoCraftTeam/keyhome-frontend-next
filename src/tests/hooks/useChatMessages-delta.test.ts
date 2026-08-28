import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Message, MessageHistoryResponse } from '@/types/chat';

/**
 * useChatMessages — WhatsApp Web-style incremental delta sync (`syncDelta`).
 *
 * The cached history stays on screen; only messages created after the latest
 * one already held are pulled, keyed on that message's UTC timestamp. This
 * spec locks in: the UTC cursor, UUID dedupe, optimistic-last merge order,
 * the long-absence `has_more` catch-up loop, the cold-cache no-op, and the
 * fact that window focus triggers a delta — never a full first-page refetch.
 */

const { fetchMessages, fetchMessagesAfter } = vi.hoisted(() => ({
  fetchMessages: vi.fn(),
  fetchMessagesAfter: vi.fn(),
}));

vi.mock('@/lib/chat/chat-api', () => ({ fetchMessages, fetchMessagesAfter }));

import {
  chatMessagesKey,
  MessagesCache,
  OPTIMISTIC_PREFIX,
  useChatMessages,
} from '@/hooks/chat/useChatMessages';

const USER = 'u1';
const CONV = 'conv-1';

function msg(uuid: string, createdAt: string): Message {
  return {
    uuid,
    sender_id: 'peer',
    created_at: createdAt,
    body: uuid,
  } as unknown as Message;
}

function history(data: Message[], hasMore = false): MessageHistoryResponse {
  return {
    data,
    has_more: hasMore,
    next_cursor: null,
  } as unknown as MessageHistoryResponse;
}

function setup(seed?: MessagesCache): {
  client: QueryClient;
  result: { current: ReturnType<typeof useChatMessages> };
} {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (seed) {
    client.setQueryData(chatMessagesKey(USER, CONV), seed);
  }
  const wrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement =>
    React.createElement(QueryClientProvider, { client }, children);

  const { result } = renderHook(() => useChatMessages(USER, CONV), { wrapper });
  return { client, result };
}

function uuids(result: {
  current: ReturnType<typeof useChatMessages>;
}): string[] {
  return result.current.messages.map((m) => m.uuid);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useChatMessages — delta sync', () => {
  const T1 = '2026-08-21T10:00:00.000Z';
  const T2 = '2026-08-21T10:05:00.000Z';
  const T3 = '2026-08-21T10:10:00.000Z';

  it('bootstraps a delta from the restored cache, keyed on the latest UTC timestamp', async () => {
    fetchMessagesAfter.mockResolvedValue(history([msg('m3', T3)]));

    const { result } = setup({
      messages: [msg('m1', T1), msg('m2', T2)],
      hasMore: false,
      cursor: null,
    });

    await waitFor(() =>
      expect(fetchMessagesAfter).toHaveBeenCalledWith(CONV, T2)
    );
    await waitFor(() => expect(uuids(result)).toEqual(['m1', 'm2', 'm3']));
    expect(fetchMessages).not.toHaveBeenCalled();
  });

  it('dedupes by uuid — an inclusive-boundary message already held is not doubled', async () => {
    // The `>=` boundary re-returns the cursor message (m2); it must not appear twice.
    fetchMessagesAfter.mockResolvedValue(
      history([msg('m2', T2), msg('m3', T3)])
    );

    const { result } = setup({
      messages: [msg('m1', T1), msg('m2', T2)],
      hasMore: false,
      cursor: null,
    });

    await waitFor(() => expect(uuids(result)).toEqual(['m1', 'm2', 'm3']));
  });

  it('keeps optimistic pending sends last after merging the delta', async () => {
    const pending = `${OPTIMISTIC_PREFIX}pending`;
    fetchMessagesAfter.mockResolvedValue(history([msg('m2', T2)]));

    const { result } = setup({
      messages: [msg('m1', T1), msg(pending, T3)],
      hasMore: false,
      cursor: null,
    });

    // Cursor is the latest SETTLED message (m1@T1), not the optimistic one.
    await waitFor(() =>
      expect(fetchMessagesAfter).toHaveBeenCalledWith(CONV, T1)
    );
    await waitFor(() => expect(uuids(result)).toEqual(['m1', 'm2', pending]));
  });

  it('is a no-op on a cold/empty cache — the full first page handles a new device', async () => {
    fetchMessages.mockResolvedValue(history([]));

    const { result } = setup(); // no seed → useQuery does the cold fetch

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.syncDelta();
    });

    expect(fetchMessagesAfter).not.toHaveBeenCalled();
  });

  it('does not bootstrap a delta when the list came from a fresh network fetch', async () => {
    fetchMessages.mockResolvedValue(history([msg('m1', T1)]));

    const { result } = setup(); // cold → network fetch → isFetchedAfterMount true

    await waitFor(() => expect(uuids(result)).toEqual(['m1']));
    // Give any pending effect a chance to (wrongly) fire.
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMessagesAfter).not.toHaveBeenCalled();
  });

  it('follows has_more, advancing the UTC cursor until it clears (long absence)', async () => {
    fetchMessagesAfter
      .mockResolvedValueOnce(history([msg('m2', T2)], true))
      .mockResolvedValueOnce(history([msg('m3', T3)], false));

    const { result } = setup({
      messages: [msg('m1', T1)],
      hasMore: false,
      cursor: null,
    });

    await waitFor(() => expect(fetchMessagesAfter).toHaveBeenCalledTimes(2));
    expect(fetchMessagesAfter).toHaveBeenNthCalledWith(1, CONV, T1);
    expect(fetchMessagesAfter).toHaveBeenNthCalledWith(2, CONV, T2);
    await waitFor(() => expect(uuids(result)).toEqual(['m1', 'm2', 'm3']));
  });

  it('runs a delta on window focus, never a full first-page refetch', async () => {
    fetchMessagesAfter.mockResolvedValue(history([]));

    setup({ messages: [msg('m1', T1)], hasMore: false, cursor: null });

    await waitFor(() => expect(fetchMessagesAfter).toHaveBeenCalled());
    fetchMessagesAfter.mockClear();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() =>
      expect(fetchMessagesAfter).toHaveBeenCalledWith(CONV, T1)
    );
    // refetchOnWindowFocus is off — the full first page is never re-pulled.
    expect(fetchMessages).not.toHaveBeenCalled();
  });
});
