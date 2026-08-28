import DirectionsPanel from '@/components/ads/DirectionsPanel';
import type { DirectionsResult, OrsProfile } from '@/services/geo.service';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetDirections } = vi.hoisted(() => ({
  mockGetDirections: vi.fn(),
}));

vi.mock('@/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ location: null }),
}));

vi.mock('@/services/geo.service', () => ({
  geoService: { getDirections: mockGetDirections },
}));

function makeResult(profile: OrsProfile): DirectionsResult {
  const labels: Record<OrsProfile, string> = {
    'driving-car': 'En voiture',
    'foot-walking': 'À pied',
    'cycling-regular': 'À vélo',
    wheelchair: 'Fauteuil roulant',
  };

  return {
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { profile },
          geometry: {
            type: 'LineString',
            coordinates: [
              [9.7, 4.05],
              [9.71, 4.06],
            ],
          },
        },
      ],
    },
    summary: {
      distance_m: profile === 'foot-walking' ? 1200 : 1800,
      duration_s: profile === 'foot-walking' ? 900 : 300,
      distance_label: profile === 'foot-walking' ? '1,2 km' : '1,8 km',
      duration_label: profile === 'foot-walking' ? '15 min' : '5 min',
    },
    profile,
    profile_label: labels[profile],
    cached: false,
  };
}

describe('DirectionsPanel transport profile', () => {
  beforeEach(() => {
    mockGetDirections.mockReset();
    mockGetDirections.mockImplementation(
      async (
        _fromLat: number,
        _fromLng: number,
        _toLat: number,
        _toLng: number,
        profile: OrsProfile
      ) => ({ data: makeResult(profile) })
    );
  });

  it('replaces the displayed map route when the user selects a loaded profile', async () => {
    const onRouteComputed = vi.fn();

    render(
      <DirectionsPanel
        adLat={4.06}
        adLng={9.71}
        userLocation={{
          latitude: 4.05,
          longitude: 9.7,
          accuracy: 10,
          isApproximate: false,
        }}
        onRouteComputed={onRouteComputed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /comment y aller/i }));

    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalledTimes(3);
    });
    expect(onRouteComputed).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' }),
      expect.objectContaining({ duration_label: '5 min' }),
      'En voiture'
    );

    fireEvent.click(screen.getByRole('button', { name: 'À pied' }));

    expect(onRouteComputed).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' }),
      expect.objectContaining({ duration_label: '15 min' }),
      'À pied'
    );
  });

  it('fetches on demand and displays the route for a not-preloaded profile (wheelchair)', async () => {
    const onRouteComputed = vi.fn();

    render(
      <DirectionsPanel
        adLat={4.06}
        adLng={9.71}
        userLocation={{
          latitude: 4.05,
          longitude: 9.7,
          accuracy: 10,
          isApproximate: false,
        }}
        onRouteComputed={onRouteComputed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /comment y aller/i }));

    // computeAll preloads driving-car, foot-walking, cycling-regular — never wheelchair.
    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalledTimes(3);
    });
    expect(mockGetDirections).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'wheelchair'
    );

    // Selecting the wheelchair mode must fetch it on demand.
    fireEvent.click(screen.getByRole('button', { name: 'Fauteuil' }));

    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalledWith(
        4.05,
        9.7,
        4.06,
        9.71,
        'wheelchair'
      );
    });
    expect(onRouteComputed).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' }),
      expect.objectContaining({ duration_label: '5 min' }),
      'Fauteuil roulant'
    );
  });

  it('re-fetches a mode whose background fetch failed when it is later selected', async () => {
    const onRouteComputed = vi.fn();

    // foot-walking rejects on its first (computeAll lazy) call, succeeds afterwards.
    let footCalls = 0;
    mockGetDirections.mockImplementation(
      async (
        _fromLat: number,
        _fromLng: number,
        _toLat: number,
        _toLng: number,
        profile: OrsProfile
      ) => {
        if (profile === 'foot-walking') {
          footCalls += 1;
          if (footCalls === 1) {
            throw new Error('ORS 429');
          }
        }
        return { data: makeResult(profile) };
      }
    );

    render(
      <DirectionsPanel
        adLat={4.06}
        adLng={9.71}
        userLocation={{
          latitude: 4.05,
          longitude: 9.7,
          accuracy: 10,
          isApproximate: false,
        }}
        onRouteComputed={onRouteComputed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /comment y aller/i }));

    // computeAll issues 3 calls; the foot-walking one rejects and is dropped.
    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalledTimes(3);
    });
    expect(footCalls).toBe(1);

    // Selecting "À pied" must re-fetch since its earlier result never landed.
    fireEvent.click(screen.getByRole('button', { name: 'À pied' }));

    await waitFor(() => {
      expect(footCalls).toBe(2);
    });
    expect(onRouteComputed).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' }),
      expect.objectContaining({ duration_label: '15 min' }),
      'À pied'
    );
  });
});
