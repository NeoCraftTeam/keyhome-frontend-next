import { ThemeProvider, createTheme } from '@mui/material/styles';
import { act, render } from '@testing-library/react';
import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mapbox cannot run inside jsdom (no WebGL, no canvas), so we stand in a
 * lightweight fake whose constructor, `setStyle`, and `remove` calls we can
 * spy on. `vi.mock` is hoisted, so the fake module and the shared registry
 * of created instances must be declared via `vi.hoisted` to be in scope.
 */
const mapboxFake = vi.hoisted(() => {
  const mapInstances: Array<{
    style: string;
    setStyle: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    listeners: Record<string, Array<() => void>>;
  }> = [];

  class FakeMap {
    public style: string;
    public addedControls: unknown[] = [];
    public setStyle = vi.fn((style: string) => {
      this.style = style;
      queueMicrotask(() => {
        this.listeners['style.load']?.forEach((cb) => cb());
      });
    });
    public remove = vi.fn();
    public resize = vi.fn();
    public addControl = vi.fn((c: unknown) => {
      this.addedControls.push(c);
    });
    public listeners: Record<string, Array<() => void>> = {};
    public addSource = vi.fn();
    public addLayer = vi.fn();
    public removeLayer = vi.fn();
    public removeSource = vi.fn();
    public project = vi.fn(() => ({ x: 0, y: 0 }));
    public unproject = vi.fn(() => [0, 0]);
    public fitBounds = vi.fn();

    constructor(options: { style: string }) {
      this.style = options.style;
      mapInstances.push(this);
      queueMicrotask(() => {
        this.listeners.load?.forEach((cb) => cb());
      });
    }

    on(): void {}

    once(event: string, cb: () => void): void {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    }

    isStyleLoaded(): boolean {
      return true;
    }

    getLayer(): undefined {
      return undefined;
    }

    getSource(): undefined {
      return undefined;
    }
  }

  class FakeMarker {
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    remove = vi.fn();
  }

  class FakeControl {}

  return {
    mapInstances,
    mapboxModule: {
      default: {
        accessToken: '',
        config: { EVENTS_URL: '' },
        Map: FakeMap,
        Marker: FakeMarker,
        NavigationControl: FakeControl,
        FullscreenControl: FakeControl,
        AttributionControl: FakeControl,
        LngLatBounds: class {
          extend() {}
        },
      },
    },
  };
});

vi.mock('mapbox-gl', () => mapboxFake.mapboxModule);
vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

vi.mock('@/lib/constants', async (original) => {
  const actual = await (
    original as () => Promise<typeof import('@/lib/constants')>
  )();
  return { ...actual, MAPBOX_TOKEN: 'test-token' };
});

import AdLocationMap from '@/components/ads/AdLocationMap';

function ThemeFlipper({ initialDark = false }: { initialDark?: boolean }) {
  const [dark, setDark] = useState(initialDark);
  const theme = createTheme({ palette: { mode: dark ? 'dark' : 'light' } });
  return (
    <ThemeProvider theme={theme}>
      <button data-testid="flip" onClick={() => setDark((d) => !d)}>
        flip
      </button>
      <AdLocationMap
        latitude={4.0511}
        longitude={9.7679}
        isLocked={true}
        quartierName="Bonanjo"
        cityName="Douala"
      />
    </ThemeProvider>
  );
}

describe('AdLocationMap', () => {
  beforeEach(() => {
    mapboxFake.mapInstances.length = 0;
  });

  it('uses setStyle on the existing map when the theme flips — no rebuild', async () => {
    const { getByTestId } = render(<ThemeFlipper initialDark={false} />);

    expect(mapboxFake.mapInstances).toHaveLength(1);
    const map = mapboxFake.mapInstances[0];
    expect(map.style).toContain('light-v11');

    await act(async () => {
      getByTestId('flip').click();
      await Promise.resolve();
    });

    expect(mapboxFake.mapInstances).toHaveLength(1); // ← no rebuild
    expect(map.remove).not.toHaveBeenCalled();
    expect(map.setStyle).toHaveBeenCalledTimes(1);
    expect(map.setStyle).toHaveBeenCalledWith(
      expect.stringContaining('dark-v11')
    );
    expect(map.style).toContain('dark-v11');
  });

  it('only tears down on unmount, not on theme flip', async () => {
    const { getByTestId, unmount } = render(
      <ThemeFlipper initialDark={false} />
    );
    const map = mapboxFake.mapInstances[0];

    await act(async () => {
      getByTestId('flip').click();
      await Promise.resolve();
    });

    expect(map.remove).not.toHaveBeenCalled();

    unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('exposes a labelled map region + accessible style picker (Gap 4)', () => {
    const { getByRole, getAllByRole } = render(
      <ThemeFlipper initialDark={false} />
    );

    // Map container Box uses role="region" with the address-aware label.
    const region = getByRole('region', {
      name: /carte de localisation du logement, bonanjo, douala/i,
    });
    expect(region).toBeInTheDocument();

    // Style picker exposes aria-pressed on each button so SR users know
    // which style is active.
    const planBtn = getByRole('button', {
      name: /afficher la carte en mode plan/i,
    });
    const satelliteBtn = getByRole('button', {
      name: /afficher la carte en mode satellite/i,
    });
    expect(planBtn).toHaveAttribute('aria-pressed', 'true');
    expect(satelliteBtn).toHaveAttribute('aria-pressed', 'false');

    // The picker is grouped so SR users hear it as a single control.
    const group = getAllByRole('group', { name: /style de la carte/i });
    expect(group).toHaveLength(1);
  });
});
