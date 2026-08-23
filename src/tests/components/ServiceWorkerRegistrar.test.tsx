import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';

/**
 * Guards the unmount teardown: the periodic update interval and the
 * `controllerchange` / `updatefound` / `load` listeners must all be released
 * so a remount (React StrictMode's dev double-invoke) can't accumulate a
 * duplicate 60-min interval or listener.
 */
describe('ServiceWorkerRegistrar', () => {
  let register: ReturnType<typeof vi.fn>;
  let containerListeners: Record<string, Set<EventListener>>;
  let registration: {
    installing: null;
    update: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Bypass the dev guard so registration runs under vitest.
    vi.stubEnv('NEXT_PUBLIC_ENABLE_SW', '1');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });

    registration = {
      installing: null,
      update: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    register = vi.fn().mockResolvedValue(registration);
    containerListeners = {};

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        register,
        addEventListener: vi.fn((type: string, cb: EventListener) => {
          (containerListeners[type] ??= new Set()).add(cb);
        }),
        removeEventListener: vi.fn((type: string, cb: EventListener) => {
          containerListeners[type]?.delete(cb);
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function flush(): Promise<void> {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('registers the service worker and starts a 60-minute update check', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const { unmount } = render(<ServiceWorkerRegistrar />);
    await flush();

    expect(register).toHaveBeenCalledWith(
      '/sw.js',
      expect.objectContaining({ scope: '/', updateViaCache: 'none' })
    );
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      60 * 60 * 1000
    );
    expect(containerListeners['controllerchange']?.size ?? 0).toBe(1);

    unmount();
  });

  it('clears the interval and all listeners on unmount (no leak)', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = render(<ServiceWorkerRegistrar />);
    await flush();

    const intervalId = setIntervalSpy.mock.results[0]?.value;
    expect(containerListeners['controllerchange']?.size ?? 0).toBe(1);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    expect(containerListeners['controllerchange']?.size ?? 0).toBe(0);
    expect(registration.removeEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function)
    );
  });
});
