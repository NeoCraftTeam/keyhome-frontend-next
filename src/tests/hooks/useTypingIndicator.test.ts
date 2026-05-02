/**
 * Unit test for useTypingIndicator: verifies the documented contract.
 *
 * - 100ms debounce before emitting `is_typing=true`
 * - 3s heartbeat keeps the indicator alive during continuous typing
 * - 3s after the last keystroke we emit `is_typing=false`
 * - stopTyping() cancels everything immediately
 *
 * We mock @/lib/echo so the hook never tries to reach a real WebSocket.
 */
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const whisperMock = vi.fn();

vi.mock('@/lib/echo', () => ({
  getEcho: () => ({
    private: () => ({ whisper: whisperMock }),
  }),
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'me-uuid' } }),
}));

import { useTypingIndicator } from '@/hooks/useTypingIndicator';

describe('useTypingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    whisperMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits is_typing=true after a 100ms debounce', () => {
    const { result } = renderHook(() => useTypingIndicator('conv-uuid'));

    act(() => {
      result.current.notifyTyping();
    });

    expect(whisperMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(whisperMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(whisperMock).toHaveBeenCalledWith(
      'typing',
      expect.objectContaining({ user_id: 'me-uuid', is_typing: true })
    );
  });

  it('emits is_typing=false after 3s of inactivity', () => {
    const { result } = renderHook(() => useTypingIndicator('conv-uuid'));

    act(() => {
      result.current.notifyTyping();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    whisperMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(whisperMock).toHaveBeenCalledWith(
      'typing',
      expect.objectContaining({ is_typing: false })
    );
  });

  it('stopTyping() cancels heartbeats and emits false immediately', () => {
    const { result } = renderHook(() => useTypingIndicator('conv-uuid'));

    act(() => {
      result.current.notifyTyping();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    whisperMock.mockClear();

    act(() => {
      result.current.stopTyping();
    });

    expect(whisperMock).toHaveBeenCalledTimes(1);
    expect(whisperMock).toHaveBeenCalledWith(
      'typing',
      expect.objectContaining({ is_typing: false })
    );
  });

  it('stopTyping() cancels pending debounce so is_typing=true is never whispered after stop', () => {
    const { result } = renderHook(() => useTypingIndicator('conv-uuid'));

    act(() => {
      result.current.notifyTyping();
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      result.current.stopTyping();
    });
    whisperMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(whisperMock.mock.calls.some((c) => c[1]?.is_typing === true)).toBe(
      false
    );
  });
});
