'use client';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';

import {
  buildPanoDataFromAngles,
  inferPanoDataFromImageSize,
  type EquirectPanoDataRect,
} from '@/lib/inferEquirectangularPanoData';
import { buildPsvKeyboardActions } from '@/lib/psvKeyboardActions';
import { attachPartialPanoPitchClamp } from '@/lib/psvPitchClampForPartialEquirect';
import type { TourConfig } from '@/types';
import type { VirtualTourNode } from '@photo-sphere-viewer/virtual-tour-plugin';
import { Close, ViewInAr } from '@mui/icons-material';
import { Box, Chip, CircularProgress, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

function safeAngleDeg(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * API / DB may return hotspots as a JSON array, a map object, or a double-encoded string.
 * Filament uses snake_case; some clients may send camelCase.
 */
function normalizeTourHotspots(raw: unknown): Array<Record<string, unknown>> {
  if (raw == null) {
    return [];
  }
  if (typeof raw === 'string') {
    try {
      return normalizeTourHotspots(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === 'object' && !Array.isArray(x),
    );
  }
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === 'object' && !Array.isArray(x),
    );
  }

  return [];
}

function resolveHotspotTargetRaw(h: Record<string, unknown>): string {
  const v = h.target_scene ?? h.targetScene ?? h.sceneId ?? h.scene_id;
  if (typeof v !== 'string') {
    return '';
  }

  return v.trim();
}

/** Match target_scene to a scene id (handles UUID letter casing drift). */
function resolveCanonicalSceneId(targetRaw: string, validIds: Set<string>): string | null {
  if (!targetRaw) {
    return null;
  }
  if (validIds.has(targetRaw)) {
    return targetRaw;
  }
  const lower = targetRaw.toLowerCase();
  for (const id of validIds) {
    if (id.toLowerCase() === lower) {
      return id;
    }
  }

  return null;
}

/** Resolve tour asset URL — route through /tour-proxy/ for same-origin loading. */
function resolveTourUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';

  let path = url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      path = new URL(url).pathname;
    } catch {
      path = url;
    }
  }

  if (path.startsWith('/tour-image/')) {
    return '/tour-proxy/' + path.slice('/tour-image/'.length);
  }
  if (path.startsWith('/tour-proxy/')) return path;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const origin = apiUrl.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8000';
    return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
  }

  return url;
}

interface TourViewerProps {
  tourConfig: TourConfig;
  onClose: () => void;
}

export default function TourViewer({ tourConfig, onClose }: TourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewerRef = useRef<InstanceType<typeof import('@photo-sphere-viewer/core').Viewer> | null>(null);
  const virtualTourRef = useRef<InstanceType<typeof import('@photo-sphere-viewer/virtual-tour-plugin').VirtualTourPlugin> | null>(null);
  const isMountedRef = useRef(true);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pitchClampDetachRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(
    tourConfig.default_scene ?? tourConfig.scenes?.[0]?.id ?? '',
  );
  const [error, setError] = useState('');

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !tourConfig.scenes?.length) return;

    try {
      // Dynamic imports to avoid SSR issues
      const [{ Viewer }, { MarkersPlugin }, { VirtualTourPlugin }, { CubemapAdapter }] = await Promise.all([
        import('@photo-sphere-viewer/core'),
        import('@photo-sphere-viewer/markers-plugin'),
        import('@photo-sphere-viewer/virtual-tour-plugin'),
        import('@photo-sphere-viewer/cubemap-adapter'),
      ]);

      if (!isMountedRef.current || !containerRef.current) return;

      const validSceneIds = new Set(tourConfig.scenes.map((s) => s.id));

      // Probe image dimensions for partial panorama detection
      const dimensionCache = new Map<string, { w: number; h: number }>();
      const probePromises = tourConfig.scenes
        .filter(
          (s) =>
            s.type !== 'cubemap' &&
            s.type !== 'multires' &&
            s.image_url &&
            (s.haov == null || s.vaov == null),
        )
        .map(
          (s) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                dimensionCache.set(s.id, {
                  w: img.naturalWidth,
                  h: img.naturalHeight,
                });
                resolve();
              };
              img.onerror = () => resolve();
              img.src = resolveTourUrl(s.image_url);
              setTimeout(resolve, 8_000);
            }),
        );

      if (probePromises.length > 0) {
        await Promise.all(probePromises);
      }

      if (!isMountedRef.current) return;

      // Build PSV Virtual Tour nodes
      type VTNode = {
        id: string;
        name?: string;
        caption?: string;
        panorama: unknown;
        adapter?: [typeof CubemapAdapter, unknown] | undefined;
        panoData?: EquirectPanoDataRect;
        defaultYaw?: string;
        defaultPitch?: string;
        defaultZoomLvl?: number;
        links: Array<{
          nodeId: string;
          position: { yaw: string; pitch: string };
          data?: { label: string };
        }>;
      };

      const nodes: VTNode[] = [];

      for (const scene of tourConfig.scenes) {
        if (scene.processing) continue;

        const rawHotspots = normalizeTourHotspots(scene.hotspots as unknown);
        const links = rawHotspots
          .map((h) => {
            const targetId = resolveCanonicalSceneId(resolveHotspotTargetRaw(h), validSceneIds);
            if (!targetId) {
              return null;
            }
            const yaw = safeAngleDeg(h.yaw, 0);
            const pitch = safeAngleDeg(h.pitch, 0);
            const labelRaw =
              typeof h.label === 'string'
                ? h.label.trim()
                : typeof h.text === 'string'
                  ? h.text.trim()
                  : '';

            return {
              nodeId: targetId,
              position: { yaw: `${yaw}deg`, pitch: `${pitch}deg` },
              data: { label: labelRaw || targetId },
            };
          })
          .filter((l): l is NonNullable<typeof l> => l !== null);

        const defaultYaw = `${safeAngleDeg(scene.initial_view?.yaw, 0)}deg`;
        const defaultPitch = `${safeAngleDeg(scene.initial_view?.pitch, 0)}deg`;
        const hfov = scene.initial_view?.hfov ?? 100;
        const minFov = 30;
        const maxFov = 120;
        const clampedFov = Math.min(Math.max(hfov, minFov), maxFov);
        const baseZoomLvl = Math.round(
          ((maxFov - clampedFov) / (maxFov - minFov)) * 100,
        );

        if (scene.type === 'cubemap' && scene.cube_map?.length === 6) {
          nodes.push({
            id: scene.id,
            name: scene.title,
            caption: scene.title,
            panorama: scene.cube_map.map((u) => resolveTourUrl(u)),
            adapter: [CubemapAdapter, undefined],
            defaultYaw,
            defaultPitch,
            defaultZoomLvl: baseZoomLvl,
            links,
          });
        } else {
          // Equirectangular (or fallback for multires)
          const panoramaUrl = resolveTourUrl(scene.image_url);
          if (!panoramaUrl) continue;

          let panoData: EquirectPanoDataRect | undefined;
          const vOff = scene.vOffset ?? 0;

          if (scene.haov != null && scene.vaov != null) {
            if (scene.haov < 360 || scene.vaov < 180 || vOff !== 0) {
              panoData = buildPanoDataFromAngles(scene.haov, scene.vaov, vOff);
            }
          } else {
            const dims = dimensionCache.get(scene.id);
            if (dims && dims.w > 0 && dims.h > 0) {
              panoData = inferPanoDataFromImageSize(dims.w, dims.h);
            }
          }

          if (panoData === undefined && vOff !== 0) {
            panoData = buildPanoDataFromAngles(360, 180, vOff);
          }

          const fullH = panoData
            ? panoData.fullHeight ?? panoData.fullWidth / 2
            : 0;
          const zoomLvlForNode =
            panoData != null && panoData.croppedHeight < fullH * 0.99
              ? Math.min(100, baseZoomLvl + 18)
              : baseZoomLvl;

          nodes.push({
            id: scene.id,
            name: scene.title,
            caption: scene.title,
            panorama: panoramaUrl,
            panoData,
            defaultYaw,
            defaultPitch,
            defaultZoomLvl: zoomLvlForNode,
            links,
          });
        }
      }

      if (nodes.length === 0) {
        setError(
          'Ce tour ne contient aucune scène exploitable pour le moment.',
        );
        setIsLoading(false);
        return;
      }

      // Find the best starting node (prefer one with hotspots)
      const preferredNode = nodes.find(
        (n) => n.links.length > 0,
      );
      const startNodeId =
        preferredNode?.id ??
        (tourConfig.default_scene && nodes.find((n) => n.id === tourConfig.default_scene)
          ? tourConfig.default_scene
          : nodes[0].id);

      const dismiss = () => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
      };

      safetyTimerRef.current = setTimeout(dismiss, 60_000);

      const viewer = new Viewer({
        container: containerRef.current,
        canvasBackground: '#1a1a2e',
        navbar: ['zoom', 'move', 'caption', 'fullscreen'],
        caption:
          tourConfig.scenes.find((s) => s.id === startNodeId)?.title ?? '',
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
        minFov: 30,
        maxFov: 120,
        keyboard: 'always',
        keyboardActions: buildPsvKeyboardActions(),
        plugins: [
          MarkersPlugin,
          VirtualTourPlugin.withConfig({
            dataMode: 'client',
            positionMode: 'manual',
            // 2d = marqueurs cliquables (comme l’éditeur bailleur). Le mode 3d peut ne rien
            // afficher si plusieurs instances Three.js sont chargées (ex. Mapbox + PSV).
            renderMode: '2d',
            nodes,
            startNodeId,
            showLinkTooltip: true,
            getLinkTooltip: (content, link) => {
              return (link.data as { label?: string })?.label || content;
            },
            transitionOptions: {
              showLoader: true,
              speed: '20rpm',
              effect: 'fade',
              rotation: true,
            },
          }),
        ],
      });

      pitchClampDetachRef.current?.();
      pitchClampDetachRef.current = attachPartialPanoPitchClamp(viewer);

      viewerRef.current = viewer;
      virtualTourRef.current = viewer.getPlugin(VirtualTourPlugin) as InstanceType<typeof VirtualTourPlugin>;

      viewer.addEventListener('ready', () => {
        clearTimeout(safetyTimerRef.current ?? undefined);
        safetyTimerRef.current = null;
        dismiss();
        viewer.notification.show({
          content:
            'Astuce : <strong>H</strong> ouvre l’aide clavier, <strong>F</strong> active le plein écran.',
          timeout: 6500,
        });
      });

      virtualTourRef.current?.addEventListener('node-changed', ({ node }: { node: VirtualTourNode }) => {
        if (!isMountedRef.current) return;
        setCurrentScene(node.id);
        const cap =
          (typeof node?.caption === 'string' && node.caption) ||
          (typeof node?.name === 'string' && node.name) ||
          '';
        viewerRef.current?.setOption('caption', cap);
      });
    } catch {
      if (!isMountedRef.current) return;
      setError(
        'Impossible de charger la visite virtuelle. Vérifiez votre connexion.',
      );
      setIsLoading(false);
    }
  }, [tourConfig]);

  useEffect(() => {
    isMountedRef.current = true;
    const frameId = window.requestAnimationFrame(() => {
      void initViewer();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      isMountedRef.current = false;
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      if (viewerRef.current) {
        pitchClampDetachRef.current?.();
        pitchClampDetachRef.current = null;
        try {
          viewerRef.current.destroy();
        } catch {
          // ignore
        }
        viewerRef.current = null;
        virtualTourRef.current = null;
      }
    };
  }, [initViewer]);

  // Escape key closes the viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const focusId = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(focusId);
  }, []);

  const handleSceneJump = (sceneId: string) => {
    if (!tourConfig.scenes.some((scene) => scene.id === sceneId)) return;
    virtualTourRef.current?.setCurrentNode(sceneId);
    setCurrentScene(sceneId);
  };

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Visite virtuelle 3D"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewInAr sx={{ color: '#fff', fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            sx={{ color: '#fff', fontWeight: 600 }}
          >
            Visite Virtuelle 3D
          </Typography>
        </Box>
        <IconButton
          ref={closeButtonRef}
          onClick={onClose}
          size="small"
          aria-label="Fermer la visite 3D"
          sx={{
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.4)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* PSV container */}
      <Box ref={containerRef} sx={{ flex: 1, position: 'relative' }} />

      {/* Loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.85)',
            gap: 2,
            zIndex: 5,
          }}
        >
          <CircularProgress sx={{ color: '#fff' }} />
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Chargement de la visite…
          </Typography>
        </Box>
      )}

      {/* Error overlay */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.85)',
            zIndex: 5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              px: 4,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}
            >
              {error}
            </Typography>
            <Chip
              label="Réessayer"
              onClick={() => {
                setError('');
                setIsLoading(true);
                initViewer();
              }}
              aria-label="Réessayer le chargement de la visite 3D"
              sx={{
                cursor: 'pointer',
                bgcolor: 'rgba(246,71,95,0.9)',
                color: '#fff',
                fontWeight: 700,
              }}
            />
          </Box>
        </Box>
      )}

      {/* Scene navigation pills */}
      {!isLoading && !error && tourConfig.scenes.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'center',
            px: 2,
            maxWidth: '90vw',
          }}
        >
          {tourConfig.scenes.map((scene) => (
            <Chip
              key={scene.id}
              label={scene.title}
              onClick={() => handleSceneJump(scene.id)}
              size="small"
              aria-label={`Aller à la scène ${scene.title}`}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                bgcolor:
                  currentScene === scene.id
                    ? 'rgba(246,71,95,0.9)'
                    : 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: '1px solid',
                borderColor:
                  currentScene === scene.id
                    ? 'rgba(246,71,95,0.5)'
                    : 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor:
                    currentScene === scene.id
                      ? 'rgba(246,71,95,1)'
                      : 'rgba(0,0,0,0.85)',
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Hint */}
      {!isLoading && !error && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.75rem',
          }}
        >
          Cliquez sur les flèches pour changer de pièce • Glissez pour
          naviguer • Molette pour zoomer • Échap pour quitter
        </Typography>
      )}
    </Box>
  );
}
