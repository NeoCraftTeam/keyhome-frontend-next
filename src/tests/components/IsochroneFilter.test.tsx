import { act, fireEvent, render } from '@testing-library/react';
import type { RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type mapboxgl from 'mapbox-gl';

// IsochroneFilter imports mapbox-gl for its types; the real module touches
// WebGL/window at import and cannot run in jsdom, so stand in an empty default.
vi.mock('mapbox-gl', () => ({ default: {} }));

const getIsochrone = vi.fn();
vi.mock('@/services/geo.service', () => ({
  geoService: {
    getIsochrone: (...args: unknown[]) => getIsochrone(...args),
  },
}));

import IsochroneFilter from '@/components/ads/IsochroneFilter';

const SOURCE_ID = 'isochrone-source';
const FILL_ID = 'isochrone-fill';
const LINE_ID = 'isochrone-line';

/** Stateful fake Mapbox map tracking which sources/layers currently exist. */
function makeFakeMap() {
  const layers = new Set<string>();
  const sources = new Set<string>();
  return {
    getCenter: vi.fn(() => ({ lat: 4.05, lng: 9.76 })),
    getLayer: vi.fn((id: string) => (layers.has(id) ? { id } : undefined)),
    getSource: vi.fn((id: string) => (sources.has(id) ? { id } : undefined)),
    addSource: vi.fn((id: string) => {
      sources.add(id);
    }),
    addLayer: vi.fn((layer: { id: string }) => {
      layers.add(layer.id);
    }),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
    _layers: layers,
    _sources: sources,
  };
}

function refTo(map: unknown): RefObject<mapboxgl.Map | null> {
  return { current: map as mapboxgl.Map } as RefObject<mapboxgl.Map | null>;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('IsochroneFilter', () => {
  it('draws the isochrone source + layers when computing', async () => {
    getIsochrone.mockResolvedValue({
      data: { geojson: { type: 'FeatureCollection', features: [] } },
    });
    const map = makeFakeMap();
    const { container, getByText } = render(
      <IsochroneFilter mapRef={refTo(map)} />
    );

    // Panel content is unmounted while collapsed → the toggle is the only button.
    fireEvent.click(container.querySelector('button')!);
    await act(async () => {
      fireEvent.click(getByText('Calculer'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(map.addSource).toHaveBeenCalledWith(
      SOURCE_ID,
      expect.objectContaining({ type: 'geojson' })
    );
    expect(map._layers.has(FILL_ID)).toBe(true);
    expect(map._layers.has(LINE_ID)).toBe(true);
  });

  it('removes its source + layers on unmount so nothing lingers on the shared map', async () => {
    getIsochrone.mockResolvedValue({
      data: { geojson: { type: 'FeatureCollection', features: [] } },
    });
    const map = makeFakeMap();
    const { container, getByText, unmount } = render(
      <IsochroneFilter mapRef={refTo(map)} />
    );

    fireEvent.click(container.querySelector('button')!);
    await act(async () => {
      fireEvent.click(getByText('Calculer'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(map._layers.size).toBe(2);
    expect(map._sources.size).toBe(1);

    unmount();

    expect(map.removeLayer).toHaveBeenCalledWith(FILL_ID);
    expect(map.removeLayer).toHaveBeenCalledWith(LINE_ID);
    expect(map.removeSource).toHaveBeenCalledWith(SOURCE_ID);
    expect(map._layers.size).toBe(0);
    expect(map._sources.size).toBe(0);
  });

  it('leaves the map untouched on unmount when nothing was drawn', () => {
    const map = makeFakeMap();
    const { unmount } = render(<IsochroneFilter mapRef={refTo(map)} />);

    unmount();

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });
});
