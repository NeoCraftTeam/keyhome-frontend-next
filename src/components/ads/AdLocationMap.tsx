'use client';

import { MAPBOX_TOKEN } from '@/lib/constants';
import { Box, Typography } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef } from 'react';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface Props {
  latitude: number;
  longitude: number;
  quartierName?: string;
  cityName?: string;
  isLocked?: boolean;
}

/**
 * Deterministically offset coordinates by ~300-500 m so the approximate
 * zone is always the same for a given ad (no random jump on re-render).
 * Uses a simple hash of the original coords as seed.
 */
function fuzzyCoords(lat: number, lng: number): [number, number] {
  const seed = Math.abs(Math.sin(lat * 1e4) * 1e4 + Math.cos(lng * 1e4) * 1e4);
  const angle = (seed % 360) * (Math.PI / 180);
  const distance = 0.003 + (seed % 200) / 100_000;
  return [lat + Math.cos(angle) * distance, lng + Math.sin(angle) * distance];
}

const APPROX_RADIUS_PX = 120;

export default function AdLocationMap({ latitude, longitude, quartierName, cityName, isLocked = false }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [displayLat, displayLng] = useMemo(
    () => (isLocked ? fuzzyCoords(latitude, longitude) : [latitude, longitude]),
    [latitude, longitude, isLocked],
  );

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) { return; }
    if (mapRef.current) { return; }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [displayLng, displayLat],
      zoom: isLocked ? 13 : 15,
      interactive: true,
      scrollZoom: false,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      if (isLocked) {
        map.addSource('approx-zone', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [displayLng, displayLat] },
            properties: {},
          },
        });

        map.addLayer({
          id: 'approx-zone-blur',
          type: 'circle',
          source: 'approx-zone',
          paint: {
            'circle-radius': APPROX_RADIUS_PX,
            'circle-color': '#F6475F',
            'circle-opacity': 0.10,
            'circle-blur': 1,
          },
        });

        map.addLayer({
          id: 'approx-zone-ring',
          type: 'circle',
          source: 'approx-zone',
          paint: {
            'circle-radius': APPROX_RADIUS_PX,
            'circle-color': 'transparent',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#F6475F',
            'circle-stroke-opacity': 0.25,
          },
        });

        const iconEl = document.createElement('div');
        iconEl.innerHTML = `
          <div style="
            width: 40px; height: 40px;
            background: rgba(246,71,95,0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#F6475F">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;
        new mapboxgl.Marker({ element: iconEl, anchor: 'center' })
          .setLngLat([displayLng, displayLat])
          .addTo(map);
      } else {
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div style="
            width: 44px; height: 44px;
            background: #222;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            border: 3px solid #fff;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `;
        new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
          .setLngLat([displayLng, displayLat])
          .addTo(map);
      }

      map.resize();
    });

    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, [displayLat, displayLng, isLocked]);

  if (!MAPBOX_TOKEN) { return null; }

  const locationLabel = [quartierName, cityName].filter(Boolean).join(', ');

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Où se situe le logement
      </Typography>
      {locationLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {locationLabel}
        </Typography>
      )}

      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: { xs: 240, sm: 300, md: 360 },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        {isLocked
          ? 'La localisation exacte sera communiquée après déverrouillage.'
          : 'L\u2019emplacement exact est indiqué sur la carte.'}
      </Typography>
    </Box>
  );
}
