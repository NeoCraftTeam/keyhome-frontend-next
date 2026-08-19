'use client';

import type { UserLocation } from '@/hooks/useUserLocation';
import { MAPBOX_TOKEN } from '@/lib/constants';
import { formatDistance, haversineDistance } from '@/lib/geo/geo';
import { brand } from '@/theme/tokens';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import { Box, Typography, useTheme } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  /** ORS GeoJSON route — when provided replaces the straight-line with the real road */
  routeGeojson?: GeoJSON.FeatureCollection | null;
  /**
   * Route summary from ORS for the currently selected transport profile. When provided, its distance
   * drives the status pill and the in-map distance label; the haversine
   * (`distanceKm`) computed below is demoted to a "à vol d'oiseau" caveat.
   */
  roadSummary?: {
    /** Road distance in metres — required so the component can classify
     *  the user-to-ad distance (`getDistanceLabel`) without re-parsing the
     *  pre-formatted label string. */
    distance_m: number;
    distance_label: string;
    duration_label: string;
    profile_label: string;
  } | null;
  /**
   * Whether the parent has the user's position on a continuous watch
   * (`navigator.geolocation.watchPosition`). When true the toggle button
   * rendered next to the style picker shows the "tracking" state. The
   * actual `useUserLocation({ watch })` call lives in the parent because
   * it owns the `userLocation` state; this prop + callback are a
   * controlled pair so the toggle stays in sync.
   */
  liveTracking?: boolean;
  onLiveTrackingChange?: (enabled: boolean) => void;
}

/**
 * Deterministically offset a coordinate by ~300–500 m for locked-ad
 * previews. Same input → same output, so the fuzzy marker stays put
 * across re-renders (otherwise it would visibly wander every time
 * the component re-mounted, defeating the obfuscation). Exported so
 * the unit suite can assert determinism + locality without hitting
 * Mapbox internals.
 */
export function fuzzyCoords(lat: number, lng: number): [number, number] {
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
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Votre position actuelle');
  el.style.cssText =
    'width:36px;height:36px;position:relative;display:flex;align-items:center;justify-content:center;';
  el.innerHTML = `
    <div aria-hidden="true" style="
      position:absolute;inset:0;
      border-radius:50%;
      background:rgba(66,133,244,0.18);
      animation:kh-pulse-blue 2s ease-out infinite;
    "></div>
    <div aria-hidden="true" style="
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
      /* Respect reduced-motion: the pulse is purely decorative. */
      @media (prefers-reduced-motion: reduce) {
        [data-kh-marker="user"] div[style*="kh-pulse-blue"] {
          animation: none !important;
        }
      }
    </style>
  `;
  el.setAttribute('data-kh-marker', 'user');
  return el;
}

function createAdMarker(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', label);
  el.style.cssText =
    'width:36px;height:48px;display:flex;flex-direction:column;align-items:center;cursor:default;';
  el.innerHTML = `
    <div aria-hidden="true" style="
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="white" style="transform:rotate(45deg)" aria-hidden="true">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>
    <div aria-hidden="true" style="
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
  // The visible label conveys distance information that isn't present
  // anywhere else on the marker overlay (the banner above the map shows
  // the same value, but the label sits where the route line bends).
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `Distance approximative : ${text}`);
  const inner = document.createElement('div');
  inner.textContent = text;
  inner.setAttribute('aria-hidden', 'true');
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
  routeGeojson = null,
  roadSummary = null,
  liveTracking = false,
  onLiveTrackingChange,
}: Props) {
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  /** Tracks all active Mapbox Marker instances so Effect 2 can remove them on re-run. */
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  /**
   * Tracks the last style URL we know is applied to the live map instance.
   * Effect 1b uses this to detect *actual* style swaps (vs. the initial
   * style set inside `new mapboxgl.Map()`) and call `setStyle()` only
   * when needed. Updating it inside Effect 1 keeps it in sync when the
   * map is recreated for unrelated reasons (lat/lng/lock change).
   */
  const appliedStyleRef = useRef<string | null>(null);
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

  // Accessible label attached to the ad marker. Built from the same
  // quartier / city props that drive the visible heading so screen readers
  // hear "Logement, Bonanjo, Douala" instead of just "Logement".
  const adMarkerLabel = useMemo(() => {
    const parts = [quartierName, cityName].filter(Boolean);
    return parts.length > 0 ? `Logement, ${parts.join(', ')}` : 'Logement';
  }, [quartierName, cityName]);

  const distanceKm = useMemo(() => {
    if (!userLocation) return null;
    const km = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      displayLat,
      displayLng
    );
    return Number.isFinite(km) ? km : null;
  }, [userLocation, displayLat, displayLng]);

  /**
   * The kilometres value that drives the status pill ("À proximité" /
   * "À distance raisonnable" / "Loin de vous") and the in-map distance
   * label. Prefer the ORS road distance whenever it's available — the
   * straight-line haversine routinely understates real-world travel
   * (e.g. across a river without a near-by bridge) and made the pill
   * over-optimistic. Falls back to haversine when ORS hasn't returned.
   */
  const effectiveDistanceKm = useMemo(() => {
    if (roadSummary && Number.isFinite(roadSummary.distance_m)) {
      return roadSummary.distance_m / 1000;
    }
    return distanceKm;
  }, [roadSummary, distanceKm]);

  // ── Effect 1: create / destroy the map ──────────────────────────────────────
  // Only re-runs when coordinates or lock status change — NOT on style changes
  // (dark-mode toggle, plan↔satellite). Effect 1b below swaps the style in
  // place on the existing instance to preserve markers / camera / overlays.
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
    // Effect 1b will compare against this to decide whether a setStyle() is
    // actually needed; updating it here keeps the two effects in sync when
    // the map is rebuilt (lat/lng/lock change) under a new style.
    appliedStyleRef.current = mapStyle;

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
      appliedStyleRef.current = null;
    };
    // mapStyle is intentionally omitted: it's read from closure once at mount,
    // and subsequent style swaps go through Effect 1b (map.setStyle) so the
    // live instance survives a theme toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayLat, displayLng, isLocked]);

  // ── Effect 1b: hot-swap the style on the live map ───────────────────────────
  // Avoids the expensive teardown + rebuild Effect 1 used to do whenever the
  // theme flipped (mapStyle was a dep). Calling `setStyle()` keeps the camera,
  // markers, and DOM-overlay attribution controls intact; Mapbox drops user-
  // added sources/layers in the process, so we bump `mapKey` once the new
  // style finishes loading to re-run Effect 2 (which re-adds the route line
  // and approx-zone source/layer).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (appliedStyleRef.current === mapStyle) return;

    appliedStyleRef.current = mapStyle;
    map.setStyle(mapStyle);
    map.once('style.load', () => {
      if (!mapRef.current) return; // unmounted while loading
      setMapKey((k) => k + 1);
    });
  }, [mapStyle]);

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
      iconEl.setAttribute('role', 'img');
      iconEl.setAttribute(
        'aria-label',
        'Zone approximative du logement (position exacte masquée)'
      );
      iconEl.innerHTML = `
        <div aria-hidden="true" style="
          width:40px;height:40px;
          background:rgba(246,71,95,0.15);
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${PRIMARY_RED}" aria-hidden="true">
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
      const isRealRoute = routeGeojson !== null;

      map.addSource('route-line', {
        type: 'geojson',
        data: isRealRoute
          ? routeGeojson
          : {
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

      if (isRealRoute) {
        // Real road route — solid blue line
        map.addLayer({
          id: 'route-line-dashed',
          type: 'line',
          source: 'route-line',
          paint: {
            'line-color': '#0284c7',
            'line-width': 4,
            'line-opacity': 0.82,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      } else {
        // Straight-line fallback — dashed red
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
      }

      const adMarker = new mapboxgl.Marker({
        element: createAdMarker(adMarkerLabel),
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
        // Prefer the pre-formatted road distance from ORS when available —
        // it's the same string the banner already shows, so users see a
        // single consistent value across the map overlay and the chip.
        const labelText = roadSummary
          ? roadSummary.distance_label
          : formatDistance(distanceKm);
        const labelMarker = new mapboxgl.Marker({
          element: createDistanceLabel(labelText, isDarkMode),
          anchor: 'center',
        })
          .setLngLat(midLngLat)
          .addTo(map);
        markersRef.current.push(labelMarker);
      });

      // ── unlocked ad, no user location: simple dark pin ───────────────────────
    } else {
      const markerEl = document.createElement('div');
      markerEl.setAttribute('role', 'img');
      markerEl.setAttribute('aria-label', adMarkerLabel);
      markerEl.innerHTML = `
        <div aria-hidden="true" style="
          width:44px;height:44px;
          background:#222;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px rgba(0,0,0,0.25);
          border:3px solid #fff;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true">
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
    routeGeojson,
    roadSummary,
    adMarkerLabel,
  ]);

  if (!MAPBOX_TOKEN) return null;

  const locationLabel = [quartierName, cityName].filter(Boolean).join(', ');
  // Pill classification follows the effective (road > haversine) value so
  // "À proximité / raisonnable / Loin" reflects how the user actually
  // travels — not the bird's-eye underestimate.
  const distanceInfo =
    effectiveDistanceKm !== null ? getDistanceLabel(effectiveDistanceKm) : null;

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
              {roadSummary ? (
                <>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ lineHeight: 1.3 }}
                  >
                    {roadSummary.duration_label} · {roadSummary.profile_label}
                    <Box
                      component="span"
                      sx={{ color: 'text.secondary', fontWeight: 400, ml: 0.5 }}
                    >
                      ({roadSummary.distance_label})
                    </Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Distance à vol d&apos;oiseau : {formatDistance(distanceKm)}
                  </Typography>
                </>
              ) : (
                <>
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
                </>
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
        <Box
          ref={mapContainerRef}
          role="region"
          aria-label={`Carte de localisation du ${adMarkerLabel.toLowerCase()}`}
          sx={{ width: '100%', height: '100%' }}
        />

        {/* Always keep the user-to-property distance visible inside Mapbox.
            Locked ads use the privacy-safe fuzzy zone, never the exact pin. */}
        {userLocation && distanceKm !== null && (
          <Box
            data-testid="map-distance-chip"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              maxWidth: 'calc(100% - 76px)',
              px: 1.25,
              py: 0.75,
              borderRadius: 2,
              color: 'text.primary',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(24,24,27,0.92)'
                  : 'rgba(255,255,255,0.95)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 3px 12px rgba(15,23,42,0.16)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <PlaceOutlined
              aria-hidden
              sx={{ fontSize: 17, color: PRIMARY_RED, flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{ lineHeight: 1.2 }}
            >
              {isLocked ? '≈ ' : ''}
              {roadSummary
                ? roadSummary.distance_label
                : formatDistance(distanceKm)}{' '}
              <Box
                component="span"
                sx={{ color: 'text.secondary', fontWeight: 500 }}
              >
                {isLocked ? 'vers la zone' : 'de vous'}
              </Box>
            </Typography>
          </Box>
        )}

        {/* Style picker overlay — bottom-left, above Mapbox attribution */}
        <Box
          role="group"
          aria-label="Style de la carte"
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
          {(['streets', 'satellite'] as const).map((style) => {
            const isActive = mapViewStyle === style;
            const label = style === 'streets' ? 'Plan' : 'Satellite';
            return (
              <Box
                key={style}
                component="button"
                type="button"
                onClick={() => setMapViewStyle(style)}
                aria-pressed={isActive}
                aria-label={`Afficher la carte en mode ${label}`}
                sx={{
                  px: 1.25,
                  py: 0.5,
                  fontSize: 10,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                  bgcolor: isActive ? 'primary.main' : 'rgba(255,255,255,0.92)',
                  color: isActive ? '#fff' : 'rgba(0,0,0,0.78)',
                  transition: 'background 0.15s',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'rgba(255,255,255,1)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>

        {/* Live-tracking toggle — only for unlocked ads with an
            onLiveTrackingChange handler. Stays in the bottom-right
            corner so it doesn't fight with the bottom-left style picker
            or the top-right NavigationControl. */}
        {!isLocked && onLiveTrackingChange && (
          <Box
            component="button"
            type="button"
            onClick={() => onLiveTrackingChange(!liveTracking)}
            aria-pressed={liveTracking}
            aria-label={
              liveTracking
                ? 'Arrêter le suivi en direct de votre position'
                : 'Suivre votre position en direct'
            }
            sx={{
              position: 'absolute',
              bottom: 28,
              right: 8,
              zIndex: 1,
              px: 1.25,
              py: 0.5,
              fontSize: 10,
              fontWeight: 600,
              border: 'none',
              borderRadius: 1.5,
              cursor: 'pointer',
              lineHeight: 1.4,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              bgcolor: liveTracking ? 'primary.main' : 'rgba(255,255,255,0.92)',
              color: liveTracking ? '#fff' : 'rgba(0,0,0,0.78)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              transition: 'background 0.15s',
              '&:hover': {
                bgcolor: liveTracking ? 'primary.dark' : 'rgba(255,255,255,1)',
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: liveTracking ? '#fff' : '#dc2626',
                boxShadow: liveTracking
                  ? '0 0 0 2px rgba(255,255,255,0.4)'
                  : 'none',
                animation: liveTracking
                  ? 'kh-tracking-pulse 1.5s ease-in-out infinite'
                  : 'none',
                '@media (prefers-reduced-motion: reduce)': {
                  animation: 'none',
                },
                '@keyframes kh-tracking-pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }}
            />
            {liveTracking ? 'Suivi actif' : 'Suivre'}
          </Box>
        )}
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
            {routeGeojson ? (
              <Box
                sx={{
                  width: 20,
                  borderTop: '3px solid #0284c7',
                  borderRadius: 1,
                  opacity: 0.85,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 20,
                  borderTop: `2px dashed ${PRIMARY_RED}`,
                  opacity: 0.65,
                }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {routeGeojson ? 'Itinéraire calculé' : 'Trajectoire directe'}
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
      ></Box>
    </Box>
  );
}
