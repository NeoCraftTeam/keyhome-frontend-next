'use client';

import type { TourConfig } from '@/types';
import type { Pannellum, PannellumSceneConfig, PannellumViewer } from '@/types/pannellum.d';
import { Close, ViewInAr } from '@mui/icons-material';
import { Box, Chip, CircularProgress, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';
const PANNELLUM_JS_FALLBACK = 'https://unpkg.com/pannellum@2.5.7/build/pannellum.js';

const injectedElements: HTMLElement[] = [];

/** Resolve tour asset URL — prepend backend origin when relative (cross-origin). */
function resolveTourUrl(url: string | undefined): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const origin = apiUrl.replace(/\/api\/v1\/?$/, '') || 'http://localhost:8000';
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

function loadPannellum(): Promise<Pannellum> {
  const win = window as unknown as Record<string, unknown>;

  if (win['pannellum']) {
    return Promise.resolve(win['pannellum'] as Pannellum);
  }

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${PANNELLUM_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = PANNELLUM_CSS;
      document.head.appendChild(link);
      injectedElements.push(link);
    }

    const scriptSources = [PANNELLUM_JS, PANNELLUM_JS_FALLBACK];
    let currentIndex = 0;

    const tryNext = () => {
      if (currentIndex >= scriptSources.length) {
        reject(new Error('Pannellum script could not be loaded from available CDNs.'));
        return;
      }

      const src = scriptSources[currentIndex++];
      let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
        injectedElements.push(script);
      }

      if (win['pannellum']) {
        resolve(win['pannellum'] as Pannellum);
        return;
      }

      const timeoutId = setTimeout(() => {
        script?.remove();
        tryNext();
      }, 12_000);

      script.addEventListener('load', () => {
        clearTimeout(timeoutId);
        resolve(win['pannellum'] as Pannellum);
      }, { once: true });

      script.addEventListener('error', () => {
        clearTimeout(timeoutId);
        script?.remove();
        tryNext();
      }, { once: true });
    };

    tryNext();
  });
}

function cleanupPannellum(): void {
  const win = window as unknown as Record<string, unknown>;
  delete win['pannellum'];
  for (const el of injectedElements) {
    el.remove();
  }
  injectedElements.length = 0;
}

interface TourViewerProps {
  tourConfig: TourConfig;
  onClose: () => void;
}

export default function TourViewer({ tourConfig, onClose }: TourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(true);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScene, setCurrentScene] = useState(
    tourConfig.default_scene ?? tourConfig.scenes?.[0]?.id ?? ''
  );
  const [error, setError] = useState('');

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !tourConfig.scenes?.length) { return; }
    try {
      const pannellum = await loadPannellum();

      const scenes: Record<string, PannellumSceneConfig> = {};
      const validSceneIds = new Set(tourConfig.scenes.map((scene) => scene.id));

      const dimensionCache = new Map<string, { w: number; h: number }>();

      const probePromises = tourConfig.scenes
        .filter((s) => s.type !== 'cubemap' && s.type !== 'multires' && s.image_url && s.haov == null)
        .map(
          (s) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                dimensionCache.set(s.id, { w: img.naturalWidth, h: img.naturalHeight });
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

      for (const scene of tourConfig.scenes) {
        const hotSpots = (scene.hotspots ?? [])
          .map((h) => {
            const targetSceneId = h.target_scene ?? h.sceneId;
            const hotspotText = h.label ?? h.text ?? '';

            if (!targetSceneId) {
              return null;
            }

            return {
              type: 'scene' as const,
              pitch: h.pitch,
              yaw: h.yaw,
              sceneId: targetSceneId,
              text: hotspotText,
              cssClass: 'kh-tour-hotspot',
              createTooltipFunc: (div: HTMLDivElement, args?: { text?: string }) => {
                if (args?.text) {
                  const tip = document.createElement('span');
                  tip.className = 'kh-hotspot-tooltip';
                  tip.textContent = args.text;
                  div.appendChild(tip);
                }
              },
              createTooltipArgs: hotspotText ? { text: hotspotText } : undefined,
            };
          })
          .filter((h): h is NonNullable<typeof h> => h !== null)
          .filter((h) => validSceneIds.has(h.sceneId));
        const base = {
          title: scene.title,
          pitch: scene.initial_view?.pitch ?? 0,
          yaw: scene.initial_view?.yaw ?? 0,
          hfov: scene.initial_view?.hfov ?? 100,
          hotSpots,
        };

        if (scene.type === 'cubemap' && scene.cube_map?.length === 6 && !scene.processing) {
          scenes[scene.id] = {
            ...base,
            type: 'cubemap',
            cubeMap: scene.cube_map.map((u) => resolveTourUrl(u)),
          };
        } else if (scene.type === 'multires' && scene.tiles_base_url && !scene.processing) {
          scenes[scene.id] = {
            ...base,
            type: 'multires',
            multiRes: {
              basePath: resolveTourUrl(scene.tiles_base_url),
              path: '/%l/%s%y_%x',
              fallbackPath: scene.fallback_base_url ? `${resolveTourUrl(scene.fallback_base_url)}/%s` : undefined,
              extension: 'webp',
              tileResolution: 512,
              maxLevel: scene.tiles_max_level ?? 3,
              cubeResolution: scene.cube_resolution ?? 2048,
            },
          };
        } else {
          const equiConfig: PannellumSceneConfig = {
            ...base,
            type: 'equirectangular',
            panorama: resolveTourUrl(scene.image_url),
          };

          if (equiConfig.type === 'equirectangular') {
            let haov = scene.haov;
            let vaov = scene.vaov;
            let vOff = scene.vOffset;

            if (haov == null || vaov == null) {
              const dims = dimensionCache.get(scene.id);
              if (dims && dims.w > 0 && dims.h > 0) {
                const ratio = dims.w / dims.h;
                if (ratio >= 1.8 && ratio <= 2.2) {
                  haov = 360;
                  vaov = 180;
                  vOff = 0;
                } else if (ratio > 2.2) {
                  haov = 360;
                  const fullH = dims.w / 2;
                  vaov = Math.round((dims.h / fullH) * 180 * 10000) / 10000;
                  vOff = 0;
                }
              }
            }

            if (haov != null && haov > 0 && haov <= 360) {
              equiConfig.haov = haov;
            }
            if (vaov != null && vaov > 0 && vaov <= 180) {
              equiConfig.vaov = vaov;

              const offset = vOff ?? 0;
              const halfVaov = vaov / 2;
              equiConfig.minPitch = -(halfVaov + offset);
              equiConfig.maxPitch = halfVaov - offset;

              if (vaov < 179) {
                equiConfig.hfov = Math.min(equiConfig.hfov ?? 100, vaov * 0.9);
                equiConfig.maxHfov = vaov;
                equiConfig.pitch = 0;
              }
            }
            if (vOff != null) {
              equiConfig.vOffset = vOff;
            }
          }

          scenes[scene.id] = equiConfig;
        }
      }

      const dismiss = () => {
        if (!loadingRef.current || !isMountedRef.current) return;
        loadingRef.current = false;
        setIsLoading(false);
      };

      // Safety net: if Pannellum's load event never fires (slow / blocked image),
      // dismiss our spinner after 60 s to avoid an infinite loading screen.
      safetyTimerRef.current = setTimeout(() => {
        dismiss();
      }, 60_000);

      // Fallback to the first scene if default_scene is missing from the config.
      const sceneIds = Object.keys(scenes);
      if (sceneIds.length === 0) {
        setError('Ce tour ne contient aucune scène exploitable pour le moment.');
        setIsLoading(false);
        return;
      }
      const preferredHotspotSceneId = sceneIds.find((id) => {
        const s = scenes[id];
        return Array.isArray(s.hotSpots) && s.hotSpots.length > 0;
      });
      const firstSceneId = preferredHotspotSceneId
        ?? (tourConfig.default_scene && scenes[tourConfig.default_scene] ? tourConfig.default_scene : sceneIds[0]);

      viewerRef.current = pannellum.viewer(containerRef.current, {
        default: {
          firstScene: firstSceneId,
          sceneFadeDuration: 1000,
          autoLoad: true,
          showControls: true,
          compass: false,
        },
        scenes,
      });

      // Dismiss our spinner when Pannellum has actually decoded and rendered the panorama.
      viewerRef.current.on('load', () => {
        clearTimeout(safetyTimerRef.current ?? undefined);
        safetyTimerRef.current = null;
        dismiss();
      });

      viewerRef.current.on('error', () => {
        if (!isMountedRef.current) {
          return;
        }
        clearTimeout(safetyTimerRef.current ?? undefined);
        safetyTimerRef.current = null;
        loadingRef.current = false;
        setError('Impossible de charger les images du tour. Vérifiez votre connexion.');
        setIsLoading(false);
      });

      viewerRef.current.on('scenechange', () => {
        if (!isMountedRef.current) {
          return;
        }
        setCurrentScene(viewerRef.current?.getScene() ?? tourConfig.default_scene);
      });
    } catch {
      if (!isMountedRef.current) {
        return;
      }
      setError('Impossible de charger la visite virtuelle. Vérifiez votre connexion.');
      setIsLoading(false);
    }
  }, [tourConfig]);

  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = true;
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
      viewerRef.current?.destroy();
      viewerRef.current = null;
      cleanupPannellum();
    };
  }, [initViewer]);

  // Escape key closes the viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); }
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
    if (!tourConfig.scenes.some((scene) => scene.id === sceneId)) {
      return;
    }
    viewerRef.current?.loadScene(sceneId);
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
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
            Visite Virtuelle 3D
          </Typography>
        </Box>
        <IconButton
          ref={closeButtonRef}
          onClick={onClose}
          size="small"
          aria-label="Fermer la visite 3D"
          sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Pannellum container */}
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
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, px: 4 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
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
                bgcolor: currentScene === scene.id ? 'rgba(246,71,95,0.9)' : 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: '1px solid',
                borderColor: currentScene === scene.id ? 'rgba(246,71,95,0.5)' : 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                '&:hover': { bgcolor: currentScene === scene.id ? 'rgba(246,71,95,1)' : 'rgba(0,0,0,0.85)' },
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
          Cliquez sur les points pour changer de pièce • Glissez pour naviguer • Molette pour zoomer • Échap pour quitter
        </Typography>
      )}
    </Box>
  );
}
