import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface FakeVisualViewport {
  height: number;
  offsetTop: number;
  listeners: Record<string, Set<() => void>>;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
  emit: (type: string) => void;
}

function installVisualViewport(
  height: number,
  offsetTop = 0
): FakeVisualViewport {
  const listeners: Record<string, Set<() => void>> = {};
  const vv: FakeVisualViewport = {
    height,
    offsetTop,
    listeners,
    addEventListener: (type, cb) => {
      (listeners[type] ??= new Set()).add(cb);
    },
    removeEventListener: (type, cb) => {
      listeners[type]?.delete(cb);
    },
    emit: (type) => {
      listeners[type]?.forEach((cb) => cb());
    },
  };
  Object.defineProperty(window, 'visualViewport', {
    value: vv,
    configurable: true,
    writable: true,
  });
  return vv;
}

function removeVisualViewport(): void {
  Object.defineProperty(window, 'visualViewport', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  removeVisualViewport();
});

describe('useVisualViewport', () => {
  it('returns the current viewport rect once enabled', () => {
    installVisualViewport(600, 0);
    const { result } = renderHook(() => useVisualViewport(true));
    expect(result.current).toEqual({ height: 600, offsetTop: 0 });
  });

  it('tracks the keyboard shrinking the viewport (resize)', () => {
    const vv = installVisualViewport(800, 0);
    const { result } = renderHook(() => useVisualViewport(true));
    expect(result.current?.height).toBe(800);

    act(() => {
      vv.height = 460; // keyboard opened
      vv.emit('resize');
    });
    expect(result.current).toEqual({ height: 460, offsetTop: 0 });
  });

  it('tracks the visual viewport offset (scroll under keyboard)', () => {
    const vv = installVisualViewport(460, 0);
    const { result } = renderHook(() => useVisualViewport(true));

    act(() => {
      vv.offsetTop = 120;
      vv.emit('scroll');
    });
    expect(result.current).toEqual({ height: 460, offsetTop: 120 });
  });

  it('returns null and attaches no listeners when disabled', () => {
    const vv = installVisualViewport(600, 0);
    const { result } = renderHook(() => useVisualViewport(false));
    expect(result.current).toBeNull();
    expect(vv.listeners['resize']).toBeUndefined();
    expect(vv.listeners['scroll']).toBeUndefined();
  });

  it('returns null when the visualViewport API is unavailable', () => {
    removeVisualViewport();
    const { result } = renderHook(() => useVisualViewport(true));
    expect(result.current).toBeNull();
  });

  it('resets to null and removes listeners when re-disabled', () => {
    const vv = installVisualViewport(600, 0);
    const { result, rerender } = renderHook(({ on }) => useVisualViewport(on), {
      initialProps: { on: true },
    });
    expect(result.current).toEqual({ height: 600, offsetTop: 0 });

    rerender({ on: false });
    expect(result.current).toBeNull();
    expect(vv.listeners['resize']?.size ?? 0).toBe(0);
    expect(vv.listeners['scroll']?.size ?? 0).toBe(0);
  });

  it('keeps a stable object identity when nothing moved (no redundant re-render)', () => {
    const vv = installVisualViewport(700, 0);
    const { result } = renderHook(() => useVisualViewport(true));
    const first = result.current;

    act(() => {
      vv.emit('scroll'); // same height + offsetTop
    });
    expect(result.current).toBe(first);
  });

  it('detaches its listeners on unmount', () => {
    const vv = installVisualViewport(600, 0);
    const { unmount } = renderHook(() => useVisualViewport(true));
    expect(vv.listeners['resize']?.size ?? 0).toBe(1);

    unmount();
    expect(vv.listeners['resize']?.size ?? 0).toBe(0);
    expect(vv.listeners['scroll']?.size ?? 0).toBe(0);
  });
});
