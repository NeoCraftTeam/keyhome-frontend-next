'use client';

import 'mapbox-gl/dist/mapbox-gl.css';
import { formatDistance, haversineDistance } from '@/lib/geo';
import { MAPBOX_TOKEN } from '@/lib/constants';
import type { UserLocation } from '@/hooks/useUserLocation';
import { Box, Typography, useTheme } from '@mui/material';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { brand } from '@/theme/tokens';

mapboxgl.accessToken = MAPBOX_TOKEN;
if (process.env.NODE_ENV === 'development') {
  Object.defineProperty(mapboxgl.config, 'EVENTS_URL', {
    value: '',
    writable: false,
  });
}

interface Props {
  latitude: number;
  longitude: number;
  quartierName?: string;
  cityName?: string;
  isLocked?: boolean;
  userLocation?: UserLocation | null;
  locationError?: string | null;
}

function fuzzyCoords(lat: number, lng: number): [number, number] {
  const seed = Math.abs(Math.sin(lat * 1e4) * 1e4 + Math.cos(lng * 1e4) * 1e4);
  const angle = (seed % 360) * (Math.PI / 180);
  const distance = 0.003 + (seed % 200) / 100_000;
  return [lat + Math.cos(angle) * distance, lng + Math.sin(angle) * distance];
}

const APPROX_RADIUS_PX = 120;
const PRIMARY_RED = brand.primary;

function getDistanceLabel(km: number): { text: string; color: string } {
  if (km < 5) return { text: 'À proximité', color: '#16a34a' };
  if (km < 50) return { text: 'À distance raisonnable', color: '#2563eb' };
  return { text: 'Loin de vous', color: PRIMARY_RED };
}

function createUserMarker(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:36px;height:36px;position:relative;display:flex;align-items:center;justify-content:center;';
  el.innerHTML = `
    <div style="
      position:absolute;inset:0;
      border-radius:50%;
      background:rgba(66,133,244,0.18);
      animation:kh-pulse-blue 2s ease-out infinite;
    "></div>
    <div style="
      width:20px;height:20px;
      background:#4285F4;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 2px 10px rgba(66,133,244,0.55);
      position:relative;z-index:1;
    "></div>
    <style>
      @keyframes kh-pulse-blue{
        0%{transform:scale(1);opacity:.7}
        70%{transform:scale(2.6);opacity:0}
        100%{transform:scale(1);opacity:0}
      }
    </style>
  `;
  return el;
}

function createAdMarker(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:36px;height:48px;display:flex;flex-direction:column;align-items:center;cursor:default;';
  el.innerHTML = `
    <div style="
      width:36px;height:36px;
      background:${PRIMARY_RED};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(246,71,95,0.45);
      display:flex;
      align-items:center;
      justify-content:center;
      flex-shrink:0;
    ">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="white" style="transform:rotate(45deg)">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>
    <div style="
      width:4px;height:12px;
      background:${PRIMARY_RED};
      border-radius:0 0 3px 3px;
      margin-top:-1px;
      box-shadow:0 3px 6px rgba(246,71,95,0.3);
    "></div>
  `;
  return el;
}

function createDistanceLabel(text: string, dark: boolean): HTMLDivElement {
  const el = document.createElement('div');
  const inner = document.createElement('div');
  inner.textContent = text;
  inner.style.cssText = `
    background: ${dark ? 'rgba(30,30,30,0.92)' : 'rgba(255,255,255,0.95)'};
    backdrop-filter: blur(6px);
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: ${PRIMARY_RED};
    box-shadow: 0 2px 8px rgba(0,0,0,${dark ? '0.4' : '0.15'});
    white-space: nowrap;
    pointer-events: none;
    border: 1px solid rgba(246,71,95,0.2);
  `;
  el.appendChild(inner);
  return el;
}

export default function AdLocationMap({
  latitude,
  longitude,
  quartierName,
  cityName,
  isLocked = false,
  userLocation,
  locationError,
}: Props) {
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  /** Tracks all active Mapbox Marker instances so Effect 2 can remove them on re-run. */
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  /**
   * Incremented each time the map style finishes loading.
   * Effect 2 depends on this so it runs after the map is ready,
   * without depending on mapRef directly (refs don't trigger re-renders).
   */
  const [mapKey, setMapKey] = useState(0);
  const [mapViewStyle, setMapViewStyle] = useState<'streets' | 'satellite'>(
    'streets'
  );

  const mapStyle =
    mapViewStyle === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : isDarkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11';

  const [displayLat, displayLng] = useMemo(
    () => (isLocked ? fuzzyCoords(latitude, longitude) : [latitude, longitude]),
    [latitude, longitude, isLocked]
  );

  const showRoute = !isLocked && !!userLocation;

  const distanceKm = useMemo(() => {
    if (!userLocation) return null;
    const km = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      latitude,
      longitude
    );
    return Number.isFinite(km) ? km : null;
  }, [userLocation, latitude, longitude]);

  // ── Effect 1: create / destroy the map ──────────────────────────────────────
  // Only re-runs when coordinates, lock status, or map style change.
  // Does NOT depend on userLocation — position updates never recreate the map.
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [displayLng, displayLat],
      zoom: isLocked ? 13 : 15,
      interactive: true,
      scrollZoom: true,
      attributionControl: false,
      projection: 'mercator',
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    mapRef.current = map;

    // Signal Effect 2 that the map style is ready. Using once() so the counter
    // only increments once per map instance even if the style reloads.
    map.once('load', () => {
      setMapKey((k) => k + 1);
    });

    return () => {
      // Remove any lingering markers before destroying the map.
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [displayLat, displayLng, isLocked, mapStyle]); // ← NO userLocation here

  // ── Effect 2: add / refresh markers — no map recreation ─────────────────────
  // Runs after the map style loads (via mapKey) and whenever location data updates.
  // watchPosition can fire many times; each call just moves the markers in-place.
  useEffect(() => {
    if (mapKey === 0) return; // map not yet loaded
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // ── helpers ──────────────────────────────────────────────────────────────
    const safeRemoveLayer = (id: string) => {
      if (map.getLayer(id)) map.removeLayer(id);
    };
    const safeRemoveSource = (id: string) => {
      if (map.getSource(id)) map.removeSource(id);
    };

    // Remove overlays from the previous Effect 2 run.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    safeRemoveLayer('route-line-dashed');
    safeRemoveSource('route-line');
    safeRemoveLayer('approx-zone-ring');
    safeRemoveLayer('approx-zone-blur');
    safeRemoveSource('approx-zone');

    // ── locked ad: fuzzy zone + house icon ───────────────────────────────────
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
          'circle-color': PRIMARY_RED,
          'circle-opacity': 0.1,
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
          'circle-stroke-color': PRIMARY_RED,
          'circle-stroke-opacity': 0.25,
        },
      });
      const iconEl = document.createElement('div');
      iconEl.innerHTML = `
        <div style="
          width:40px;height:40px;
          background:rgba(246,71,95,0.15);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${PRIMARY_RED}">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
      `;
      const m = new mapboxgl.Marker({ element: iconEl, anchor: 'center' })
        .setLngLat([displayLng, displayLat])
        .addTo(map);
      markersRef.current.push(m);

      // ── unlocked ad + user location: route line + blue + red markers ─────────
    } else if (showRoute && userLocation && distanceKm !== null) {
      map.addSource('route-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [userLocation.longitude, userLocation.latitude],
              [displayLng, displayLat],
            ],
          },
          properties: {},
        },
      });
      map.addLayer({
        id: 'route-line-dashed',
        type: 'line',
        source: 'route-line',
        paint: {
          'line-color': PRIMARY_RED,
          'line-width': 2.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.7,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      const adMarker = new mapboxgl.Marker({
        element: createAdMarker(),
        anchor: 'bottom',
      })
        .setLngLat([displayLng, displayLat])
        .addTo(map);
      const userMarker = new mapboxgl.Marker({
        element: createUserMarker(),
        anchor: 'center',
      })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
      markersRef.current.push(adMarker, userMarker);

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([userLocation.longitude, userLocation.latitude]);
      bounds.extend([displayLng, displayLat]);
      map.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 50, right: 50 },
        maxZoom: 14,
        duration: 800,
      });

      map.once('idle', () => {
        if (!mapRef.current) return; // guard: map may have been removed
        const userPx = map.project([
          userLocation.longitude,
          userLocation.latitude,
        ]);
        const adPx = map.project([displayLng, displayLat]);
        const midLngLat = map.unproject([
          (userPx.x + adPx.x) / 2,
          (userPx.y + adPx.y) / 2,
        ]);
        const labelMarker = new mapboxgl.Marker({
          element: createDistanceLabel(formatDistance(distanceKm), isDarkMode),
          anchor: 'center',
        })
          .setLngLat(midLngLat)
          .addTo(map);
        markersRef.current.push(labelMarker);
      });

      // ── unlocked ad, no user location: simple dark pin ───────────────────────
    } else {
      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          width:44px;height:44px;
          background:#222;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px rgba(0,0,0,0.25);
          border:3px solid #fff;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
      `;
      const m = new mapboxgl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([displayLng, displayLat])
        .addTo(map);
      markersRef.current.push(m);
    }

    map.resize();
  }, [
    mapKey,
    isLocked,
    showRoute,
    userLocation,
    distanceKm,
    isDarkMode,
    displayLat,
    displayLng,
  ]);

  if (!MAPBOX_TOKEN) return null;

  const locationLabel = [quartierName, cityName].filter(Boolean).join(', ');
  const distanceInfo =
    distanceKm !== null ? getDistanceLabel(distanceKm) : null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Title */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Où se situe le logement
      </Typography>
      {locationLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {locationLabel}
        </Typography>
      )}

      {/* Distance banner — only for unlocked ads with user location */}
      {showRoute && distanceKm !== null && distanceInfo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            p: 1.5,
            mb: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: brand.primaryAlpha10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PlaceOutlined sx={{ fontSize: 20, color: PRIMARY_RED }} />
            </Box>
            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ lineHeight: 1.3 }}
              >
                {formatDistance(distanceKm)} de votre position
                {userLocation?.isApproximate && (
                  <Box
                    component="span"
                    sx={{
                      color: 'warning.main',
                      fontWeight: 600,
                      ml: 0.5,
                      fontSize: 'inherit',
                    }}
                  >
                    (approx.)
                  </Box>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distance à vol d&apos;oiseau
              </Typography>
              {userLocation?.isApproximate && (
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ display: 'block', mt: 0.25, fontSize: '0.65rem' }}
                >
                  Position approximative (précision ~
                  {Math.round(userLocation.accuracy / 1000)} km)
                </Typography>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: distanceInfo.color,
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ color: distanceInfo.color, fontSize: '0.7rem' }}
            >
              {distanceInfo.text}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Map */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 240, sm: 300, md: 360 },
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%' }} />

        {/* Style picker overlay — bottom-left, above Mapbox attribution */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 28,
            left: 8,
            zIndex: 1,
            display: 'flex',
            borderRadius: 1.5,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          {(['streets', 'satellite'] as const).map((style) => (
            <Box
              key={style}
              component="button"
              type="button"
              onClick={() => setMapViewStyle(style)}
              sx={{
                px: 1.25,
                py: 0.5,
                fontSize: 10,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1.4,
                bgcolor:
                  mapViewStyle === style
                    ? 'primary.main'
                    : 'rgba(255,255,255,0.92)',
                color: mapViewStyle === style ? '#fff' : 'rgba(0,0,0,0.78)',
                transition: 'background 0.15s',
                '&:hover': {
                  bgcolor:
                    mapViewStyle === style
                      ? 'primary.dark'
                      : 'rgba(255,255,255,1)',
                },
              }}
            >
              {style === 'streets' ? 'Plan' : 'Satellite'}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legend — only when route is shown */}
      {showRoute && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2.5,
            mt: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#4285F4',
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Votre position
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: PRIMARY_RED,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Logement
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 20,
                borderTop: `2px dashed ${PRIMARY_RED}`,
                opacity: 0.65,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Trajectoire directe
            </Typography>
          </Box>
        </Box>
      )}

      {/* Geolocation refused hint — only for unlocked ads when user denied */}
      {!isLocked && locationError && !userLocation && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {locationError} Autorisez la localisation pour afficher la distance
            et la trajectoire.
          </Typography>
        </Box>
      )}

      {/* Disclaimer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          mt: 1.5,
        }}
      >
        <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', mt: 0.15 }} />
        <Typography variant="caption" color="text.secondary">
          {isLocked
            ? 'La localisation exacte sera communiquée après déverrouillage.'
            : showRoute
              ? 'Distance calculée en ligne droite. L\u2019emplacement exact est visible car l\u2019annonce est débloquée.'
              : 'L\u2019emplacement exact est indiqué sur la carte.'}
        </Typography>
      </Box>
    </Box>
  );
}
