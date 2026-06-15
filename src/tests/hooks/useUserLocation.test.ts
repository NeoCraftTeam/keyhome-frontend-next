import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * useUserLocation owns a module-level singleton (one in-flight geolocation
 * request shared by every consumer). Tests need a fresh singleton per
 * case, otherwise `_settled` leaks across runs. `vi.resetModules()` plus
 * a dynamic import achieves that without exposing test-only helpers from
 * the hook itself.
 */
async function importHook() {
  vi.resetModules();
  return await import('@/hooks/useUserLocation');
}

interface FakeGeo {
  getCurrentPosition: ReturnType<typeof vi.fn>;
  watchPosition: ReturnType<typeof vi.fn>;
  clearWatch: ReturnType<typeof vi.fn>;
}

function installFakeGeolocation(): FakeGeo {
  const geo: FakeGeo = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(() => 42), // a stable watch-id token
    clearWatch: vi.fn(),
  };
  Object.defineProperty(navigator, 'geolocation', {
    value: geo,
    configurable: true,
  });
  return geo;
}

describe('useUserLocation', () => {
  let geo: FakeGeo;

  beforeEach(() => {
    geo = installFakeGeolocation();
    // Clear cached / denied state so tests are deterministic.
    localStorage.removeItem('user-location');
    localStorage.removeItem('user-location-denied');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses getCurrentPosition for one-shot mode (default)', async () => {
    const { useUserLocation } = await importHook();
    renderHook(() => useUserLocation());

    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it('uses watchPosition when watch: true', async () => {
    const { useUserLocation } = await importHook();
    renderHook(() => useUserLocation({ watch: true }));

    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('clears the watch only when the last watcher unmounts', async () => {
    const { useUserLocation } = await importHook();
    const a = renderHook(() => useUserLocation({ watch: true }));
    const b = renderHook(() => useUserLocation({ watch: true }));

    // Two listeners, one shared watch.
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
    expect(geo.clearWatch).not.toHaveBeenCalled();

    a.unmount();
    // Watch still needed by `b`.
    expect(geo.clearWatch).not.toHaveBeenCalled();

    b.unmount();
    // Last watcher gone — watch released.
    expect(geo.clearWatch).toHaveBeenCalledWith(42);
  });

  it('toggling watch from false → true upgrades the singleton to watchPosition', async () => {
    const { useUserLocation } = await importHook();
    const { rerender } = renderHook(
      ({ watch }: { watch: boolean }) => useUserLocation({ watch }),
      { initialProps: { watch: false } }
    );

    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).not.toHaveBeenCalled();

    rerender({ watch: true });
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);
  });
});
