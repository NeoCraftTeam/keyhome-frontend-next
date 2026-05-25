'use client';

import {
  buildPanoDataFromAngles,
  inferPanoDataFromImageSize,
  type EquirectPanoDataRect,
} from '@/lib/tour/inferEquirectangularPanoData';
import { buildPsvKeyboardActions } from '@/lib/tour/psvKeyboardActions';
import { attachPartialPanoPitchClamp } from '@/lib/tour/psvPitchClampForPartialEquirect';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Box, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dark, neutral } from '@/theme/tokens';

/**
 * Resolve the panorama URL for the viewer.
 *
 * - blob:… / data:… → returned as-is
 * - Any string containing tour-image/ → normalized to /tour-proxy/… (same-origin via Next rewrite)
 * - Already /tour-proxy/ → unchanged
 * - Other absolute http(s) URLs → unchanged (direct fetch; may need CORS on the server)
 */
function resolvePanoramaUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  let path = url.trim();

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search;
    } catch {
      path = url.trim();
    }
  }

  const tourKey = 'tour-image/';
  const tourIdx = path.indexOf(tourKey);
  if (tourIdx >= 0) {
    path = `/${path.slice(tourIdx)}`;
  }

  if (path.startsWith('/tour-image/')) {
    return '/tour-proxy/' + path.slice('/tour-image/'.length);
  }

  if (path.startsWith('/tour-proxy/')) return path;

  return url.trim();
}

/** Same-origin absolute URL for probing dimensions (Image + relative path). */
function toAbsoluteImageSrc(url: string): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  if (typeof window === 'undefined') {
    return url;
  }
  return url.startsWith('/')
    ? `${window.location.origin}${url}`
    : `${window.location.origin}/${url}`;
}

async function inferPanoDataFromImageDimensions(
  imageUrl: string
): Promise<EquirectPanoDataRect | undefined> {
  const src = toAbsoluteImageSrc(imageUrl);

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const finish = (v: EquirectPanoDataRect | undefined) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      resolve(v);
    };

    const timeoutId = setTimeout(() => finish(undefined), 12_000);

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w <= 0 || h <= 0) {
        finish(undefined);
        return;
      }
      finish(inferPanoDataFromImageSize(w, h));
    };

    img.onerror = () => finish(undefined);
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = src;
  });
}

const HOTSPOT_NAV_MARKER_HTML =
  '<div class="psv-hotspot-nav" role="presentation" aria-hidden="true">' +
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' +
  '<circle cx="16" cy="16" r="13" fill="currentColor" stroke="white" stroke-width="2.5"/>' +
  '<path d="M11 16h10M17 11l5 5-5 5" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg></div>';

const HOTSPOT_NAV_DROP_SHADOW = `drop-shadow(0 2px 6px ${alpha(neutral.black, 0.45)})`;

// ── Types ─────────────────────────────────────────────────────────────
export interface PanoramaHotspot {
  pitch: number;
  yaw: number;
  type: 'scene' | 'info';
  text?: string;
  sceneId?: string;
}

interface PanoramaViewerProps {
  /** URL of the equirectangular panorama image */
  imageUrl: string;
  /**
   * When set (new upload), the viewer creates its own object URL so Three/FileLoader is not racing
   * with a parent-held blob URL that may be revoked on re-renders.
   */
  imageFile?: File | null;
  /** Existing hotspots to display */
  hotspots?: PanoramaHotspot[];
  /** Called when user clicks on the panorama (for placing hotspots) */
  onPanoramaClick?: (coords: { pitch: number; yaw: number }) => void;
  /** Height of the viewer */
  height?: number | string;
  /** Whether the viewer is in "place hotspot" mode */
  placingMode?: boolean;
  /** Initial view */
  initialView?: { pitch?: number; yaw?: number; hfov?: number };
  /** Horizontal angle of view for partial panoramas */
  haov?: number;
  /** Vertical angle of view for partial panoramas */
  vaov?: number;
  /** Vertical offset for partial panoramas */
  vOffset?: number;
  /** Texte affiché dans la barre PSV (bouton « caption ») */
  caption?: string;
  /**
   * Barre d’outils PSV (zoom, flèches, légende, plein écran). Désactiver en mode placement si besoin.
   * @default true
   */
  showNavbar?: boolean;
}

function buildMarkerConfigs(hs: PanoramaHotspot[]) {
  return hs.map((h, i) => ({
    id: `hs-${i}`,
    position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
    html: HOTSPOT_NAV_MARKER_HTML,
    size: { width: 40, height: 40 },
    anchor: 'center center' as const,
    tooltip: h.text || `Hotspot ${i + 1}`,
  }));
}

export default function PanoramaViewer({
  imageUrl,
  imageFile = null,
  hotspots = [],
  onPanoramaClick,
  height = 350,
  placingMode = false,
  initialView,
  haov = 360,
  vaov = 180,
  vOffset = 0,
  caption = '',
  showNavbar = true,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersPluginRef = useRef<any>(null);
  const placementListenersAbortRef = useRef<AbortController | null>(null);
  const pitchClampDetachRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownedBlobUrl, setOwnedBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setOwnedBlobUrl(null);
      return undefined;
    }
    const u = URL.createObjectURL(imageFile);
    setOwnedBlobUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setOwnedBlobUrl(null);
    };
  }, [imageFile]);

  const panoramaInputUrl = imageFile ? (ownedBlobUrl ?? '') : imageUrl;

  const onClickRef = useRef(onPanoramaClick);
  onClickRef.current = onPanoramaClick;

  const placingRef = useRef(placingMode);
  placingRef.current = placingMode;

  const hotspotsRef = useRef(hotspots);
  hotspotsRef.current = hotspots;

  const captionRef = useRef(caption);
  captionRef.current = caption;

  // Inject PSV CSS via <link> tags — guaranteed to work regardless of bundler
  useEffect(() => {
    const cssUrls = [
      'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core@5/index.min.css',
      'https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/markers-plugin@5/index.min.css',
    ];
    cssUrls.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  // Apply crosshair cursor directly on PSV container when in placing mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (placingMode) {
      el.style.cursor = 'crosshair';
      el.querySelectorAll('canvas').forEach((c) => {
        c.style.cursor = 'crosshair';
      });
    } else {
      el.style.cursor = '';
      el.querySelectorAll('canvas').forEach((c) => {
        c.style.cursor = '';
      });
    }
  }, [placingMode]);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !panoramaInputUrl) return;

    try {
      setLoading(true);
      setError(null);

      // Allow the DOM to settle (Collapse animations etc.)
      await new Promise((r) => setTimeout(r, 350));

      const panoramaUrl = resolvePanoramaUrl(panoramaInputUrl);
      if (!panoramaUrl) {
        throw new Error("Aucune URL d'image panoramique.");
      }

      placementListenersAbortRef.current?.abort();
      placementListenersAbortRef.current = null;

      // Destroy previous viewer if any
      if (viewerRef.current) {
        pitchClampDetachRef.current?.();
        pitchClampDetachRef.current = null;
        try {
          viewerRef.current.destroy();
        } catch {
          // ignore
        }
        viewerRef.current = null;
        markersPluginRef.current = null;
      }

      // Dynamic import PSV modules (avoids SSR issues)
      const [{ Viewer, EquirectangularAdapter }, { MarkersPlugin }] =
        await Promise.all([
          import('@photo-sphere-viewer/core'),
          import('@photo-sphere-viewer/markers-plugin'),
        ]);

      if (!containerRef.current) return;

      let panoData: EquirectPanoDataRect | undefined;
      if (haov !== 360 || vaov !== 180 || vOffset !== 0) {
        panoData = buildPanoDataFromAngles(haov, vaov, vOffset);
      } else {
        panoData = await inferPanoDataFromImageDimensions(panoramaUrl);
      }

      const markers = buildMarkerConfigs(hotspotsRef.current);

      // Convert hfov (degrees) to zoom level (0-100)
      // PSV: zoom 0 = maxFov, zoom 100 = minFov
      const hfov = initialView?.hfov || 100;
      const minFov = 30;
      const maxFov = 120;
      const clampedFov = Math.min(Math.max(hfov, minFov), maxFov);
      let defaultZoomLvl = Math.round(
        ((maxFov - clampedFov) / (maxFov - minFov)) * 100
      );
      if (panoData) {
        const fh = panoData.fullHeight ?? panoData.fullWidth / 2;
        if (panoData.croppedHeight < fh * 0.99) {
          defaultZoomLvl = Math.min(100, defaultZoomLvl + 15);
        }
      }

      const viewer = new Viewer({
        container: containerRef.current,
        adapter: [EquirectangularAdapter, { useXmpData: true }],
        panorama: panoramaUrl,
        defaultYaw: `${initialView?.yaw || 0}deg`,
        defaultPitch: `${initialView?.pitch || 0}deg`,
        defaultZoomLvl,
        minFov,
        maxFov,
        navbar:
          showNavbar && !placingRef.current
            ? ['zoom', 'move', 'caption', 'fullscreen']
            : false,
        caption: captionRef.current || undefined,
        lang: {
          zoom: 'Zoom',
          zoomOut: 'Dézoomer',
          zoomIn: 'Zoomer',
          moveUp: 'Haut',
          moveDown: 'Bas',
          moveLeft: 'Gauche',
          moveRight: 'Droite',
          fullscreen: 'Plein écran',
          loading: 'Chargement…',
          loadError: 'Impossible de charger le panorama',
        },
        canvasBackground: dark.panoramaViewer,
        panoData,
        mousemove: !placingRef.current,
        keyboard: showNavbar && !placingRef.current ? 'always' : false,
        keyboardActions: buildPsvKeyboardActions(),
        plugins: [
          MarkersPlugin.withConfig({
            markers,
          }),
        ],
      });

      pitchClampDetachRef.current?.();
      pitchClampDetachRef.current = attachPartialPanoPitchClamp(viewer);

      viewerRef.current = viewer;
      markersPluginRef.current = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

      // Dismiss loading when viewer is ready, with fallback timeout
      let loadingDismissed = false;
      const dismissLoading = () => {
        if (loadingDismissed) return;
        loadingDismissed = true;
        setLoading(false);
      };
      viewer.addEventListener('ready', () => {
        dismissLoading();
        const plugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
        markersPluginRef.current = plugin;
        try {
          plugin?.setMarkers(buildMarkerConfigs(hotspotsRef.current));
        } catch {
          // ignore
        }
        try {
          viewer.setOption('mousemove', !placingRef.current);
          viewer.setOption(
            'keyboard',
            showNavbar && !placingRef.current ? 'always' : false
          );
        } catch {
          // ignore
        }
      });
      viewer.addEventListener('panorama-error', (evt: { error?: Error }) => {
        if (evt.error?.name === 'AbortError') {
          return;
        }
        const detail =
          evt.error?.message?.trim() || 'Fichier ou réseau inaccessible.';
        setError(
          `Impossible de charger le panorama. ${detail} Vérifiez le format (JPEG/PNG/WebP), la taille du fichier, et que NEXT_PUBLIC_API_URL pointe vers Laravel (rewrite /tour-proxy).`
        );
        setLoading(false);
      });
      setTimeout(dismissLoading, 8_000);

      // ── Click handling for hotspot placement ──
      // PSV only dispatches "click" when movement stays within ~4px; dragging to look around consumes the gesture.
      // In placing mode we set mousemove: false so a normal click hits the sphere and fires click.
      let lastClickTime = 0;
      const fireClick = (yawRad: number, pitchRad: number) => {
        if (!placingRef.current || !onClickRef.current) {
          return;
        }
        const now = Date.now();
        if (now - lastClickTime < 280) {
          return;
        }
        lastClickTime = now;
        const yawDeg = (yawRad * 180) / Math.PI;
        const pitchDeg = (pitchRad * 180) / Math.PI;
        onClickRef.current({ pitch: pitchDeg, yaw: yawDeg });
      };

      viewer.addEventListener(
        'click',
        (e: {
          data?: { yaw: number; pitch: number; rightclick?: boolean };
        }) => {
          const data = e?.data;
          if (!data || data.rightclick) {
            return;
          }
          if (typeof data.yaw !== 'number' || typeof data.pitch !== 'number') {
            return;
          }
          fireClick(data.yaw, data.pitch);
        }
      );

      const PLACE_MOVE_THRESHOLD_PX = 22;
      let downPos: { x: number; y: number } | null = null;

      const onPointerDown = (ev: PointerEvent) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) {
          return;
        }
        downPos = { x: ev.clientX, y: ev.clientY };
      };

      const onPointerUp = (ev: PointerEvent) => {
        if (!placingRef.current || !onClickRef.current) {
          downPos = null;
          return;
        }
        if (ev.pointerType === 'mouse' && ev.button !== 0) {
          downPos = null;
          return;
        }
        if (!downPos) {
          return;
        }
        const dx = ev.clientX - downPos.x;
        const dy = ev.clientY - downPos.y;
        downPos = null;
        if (Math.hypot(dx, dy) > PLACE_MOVE_THRESHOLD_PX) {
          return;
        }

        const v = viewerRef.current;
        const container = containerRef.current;
        if (!v?.dataHelper || !container) {
          return;
        }
        const rect = container.getBoundingClientRect();
        const viewerX = ev.clientX - rect.left;
        const viewerY = ev.clientY - rect.top;
        try {
          const coords = v.dataHelper.viewerCoordsToSphericalCoords({
            x: viewerX,
            y: viewerY,
          });
          if (coords) {
            fireClick(coords.yaw, coords.pitch);
          }
        } catch {
          // raycast failed
        }
      };

      const ac = new AbortController();
      placementListenersAbortRef.current = ac;
      containerRef.current.addEventListener('pointerdown', onPointerDown, {
        signal: ac.signal,
      });
      containerRef.current.addEventListener('pointerup', onPointerUp, {
        signal: ac.signal,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Impossible de charger le panorama: ${msg}`);
      setLoading(false);
    }
  }, [
    panoramaInputUrl,
    haov,
    vaov,
    vOffset,
    initialView?.pitch,
    initialView?.yaw,
    initialView?.hfov,
    showNavbar,
  ]);

  // Update markers without reinitializing the viewer
  useEffect(() => {
    const plugin = markersPluginRef.current;
    if (!plugin) return;

    try {
      plugin.setMarkers(buildMarkerConfigs(hotspots));
    } catch {
      // Plugin may not be ready yet
    }
  }, [hotspots]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v || loading) {
      return;
    }
    try {
      v.setOption('mousemove', !placingMode);
      v.setOption('keyboard', showNavbar && !placingMode ? 'always' : false);
    } catch {
      // Viewer not fully ready
    }
  }, [placingMode, loading, showNavbar]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v || loading) {
      return;
    }
    if (!showNavbar) {
      return;
    }
    try {
      v.setOption(
        'navbar',
        placingMode ? false : ['zoom', 'move', 'caption', 'fullscreen']
      );
      v.setOption('keyboard', showNavbar && !placingMode ? 'always' : false);
      if (!placingMode) {
        v.setOption('caption', caption || '');
      }
    } catch {
      // Navbar not updatable yet
    }
  }, [placingMode, showNavbar, caption, loading]);

  useEffect(() => {
    initViewer();
    return () => {
      placementListenersAbortRef.current?.abort();
      placementListenersAbortRef.current = null;
      if (viewerRef.current) {
        pitchClampDetachRef.current?.();
        pitchClampDetachRef.current = null;
        try {
          viewerRef.current.destroy();
        } catch {
          // ignore
        }
        viewerRef.current = null;
        markersPluginRef.current = null;
      }
    };
  }, [initViewer]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: dark.panoramaViewer,
        cursor: placingMode ? 'crosshair' : 'grab',
        border: placingMode ? '2px solid' : '1px solid',
        borderColor: placingMode ? 'primary.main' : 'divider',
        transition: 'border-color 0.2s',
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          width: '100%',
          height: '100%',
          '& .psv-hotspot-nav': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 0,
            color: 'primary.main',
            filter: HOTSPOT_NAV_DROP_SHADOW,
            transition: 'transform 0.15s ease',
            cursor: 'pointer',
          },
          '& .psv-hotspot-nav:hover': {
            transform: 'scale(1.08)',
          },
        }}
      />

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(neutral.black, 0.6),
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <CircularProgress size={36} sx={{ color: 'white', mb: 1 }} />
          <Typography variant="caption" sx={{ color: 'white' }}>
            Chargement du panorama...
          </Typography>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(neutral.black, 0.7),
            zIndex: 10,
          }}
        >
          <Typography variant="body2" sx={{ color: 'error.light' }}>
            {error}
          </Typography>
        </Box>
      )}

      {placingMode && !loading && !error && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'primary.main',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            zIndex: 20,
            boxShadow: `0 2px 8px ${alpha(neutral.black, 0.3)}`,
          }}
        >
          <Typography variant="caption" fontWeight={700}>
            Mode placement : la rotation à la souris est désactivée — orientez
            la vue avant « Placer », puis cliquez sur le panorama
          </Typography>
        </Box>
      )}
    </Box>
  );
}
