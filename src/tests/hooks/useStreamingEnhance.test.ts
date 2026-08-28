import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStreamingEnhance } from '@/hooks/useStreamingEnhance';

/**
 * useStreamingEnhance — SSE description enhancement.
 *
 * Locks in the two behaviours the "j'améliore renvoie le même texte" fix
 * depends on: the form context travels in the POST body alongside the raw
 * description, and any failure (bad response OR network throw) surfaces via
 * onError instead of being swallowed silently.
 */

const encoder = new TextEncoder();

function sseResponse(chunks: string[]): Response {
  let i = 0;
  const reader = {
    read: async (): Promise<{ done: boolean; value?: Uint8Array }> => {
      if (i < chunks.length) {
        const value = encoder.encode(chunks[i]);
        i += 1;
        return { done: false, value };
      }
      return { done: true, value: undefined };
    },
  };
  return {
    ok: true,
    body: { getReader: () => reader },
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useStreamingEnhance', () => {
  it('sends the form context in the request body and resolves with the streamed text', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          'data: {"delta":"Terrain titré"}\n\n',
          'data: {"delta":" à Limbé."}\n\n',
          'event: done\ndata: {}\n\n',
        ])
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useStreamingEnhance());
    const onComplete = vi.fn();

    await act(async () => {
      await result.current.startStream('Terrain à Limbé', onComplete, {
        context: { type: 'Terrain', city: 'Limbé', surface: 100 },
      });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      description: 'Terrain à Limbé',
      type: 'Terrain',
      city: 'Limbé',
      surface: 100,
    });
    expect(onComplete).toHaveBeenCalledWith('Terrain titré à Limbé.');
  });

  it('invokes onError and never completes when the response is not ok', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, body: null } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useStreamingEnhance());
    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await result.current.startStream('Terrain à Limbé', onComplete, {
        onError,
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it('invokes onError when the request throws a non-abort error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useStreamingEnhance());
    const onComplete = vi.fn();
    const onError = vi.fn();

    await act(async () => {
      await result.current.startStream('Terrain à Limbé', onComplete, {
        onError,
      });
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
