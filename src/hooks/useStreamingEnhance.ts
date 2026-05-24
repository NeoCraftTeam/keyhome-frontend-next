'use client';

import { useCallback, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface StreamingState {
  isStreaming: boolean;
  streamedText: string;
}

/**
 * Hook that calls POST /ads/ai/stream-enhance and streams the result
 * token-by-token via SSE.
 *
 * Usage:
 *   const { isStreaming, streamedText, startStream, cancelStream } = useStreamingEnhance();
 *   await startStream(description, (full) => setValue('description', full));
 */
export function useStreamingEnhance() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: '',
  });
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (
      description: string,
      onComplete: (full: string) => void
    ): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ isStreaming: true, streamedText: '' });

      let accumulated = '';

      try {
        const token =
          typeof document !== 'undefined'
            ? document.cookie
                .split('; ')
                .find((r) => r.startsWith('XSRF-TOKEN='))
                ?.split('=')[1]
            : undefined;

        const res = await fetch(`${API_BASE}/api/v1/ads/ai/stream-enhance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
          },
          body: JSON.stringify({ description }),
          credentials: 'include',
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setState({ isStreaming: false, streamedText: '' });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === 'event: done') {
              onComplete(accumulated);
              setState({ isStreaming: false, streamedText: accumulated });
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(6)) as {
                  delta?: string;
                };
                if (payload.delta) {
                  accumulated += payload.delta;
                  setState((s) => ({
                    ...s,
                    streamedText: accumulated,
                  }));
                }
              } catch {
                // malformed chunk — skip
              }
            }
          }
        }

        onComplete(accumulated);
        setState({ isStreaming: false, streamedText: accumulated });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState({ isStreaming: false, streamedText: '' });
        }
      }
    },
    []
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setState({ isStreaming: false, streamedText: '' });
  }, []);

  return { ...state, startStream, cancelStream };
}
