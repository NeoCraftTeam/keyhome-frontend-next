'use client';

import type { TourConfig } from '@/types';
import type { Pannellum, PannellumSceneConfig, PannellumViewer } from '@/types/pannellum.d';
import { Close, ViewInAr } from '@mui/icons-material';
import { Box, Chip, CircularProgress, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js';
const PANNELLUM_JS_FALLBACK = 'https://unpkg.com/pannellum@2.5.7/build/pannellum.js';

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
          scenes[scene.id] = { ...base, type: 'cubemap', cubeMap: scene.cube_map };
        } else if (scene.type === 'multires' && scene.tiles_base_url && !scene.processing) {
          scenes[scene.id] = {
            ...base,
            type: 'multires',
            multiRes: {
              basePath: scene.tiles_base_url,
              path: '/%l/%s%y_%x',
              fallbackPath: scene.fallback_base_url ? `${scene.fallback_base_url}/%s` : undefined,
              extension: 'webp',
              tileResolution: 512,
              maxLevel: scene.tiles_max_level ?? 3,
              cubeResolution: scene.cube_resolution ?? 2048,
            },
          };
        } else {
          // equirectangular — also used as fallback while conversion job is running
          scenes[scene.id] = { ...base, type: 'equirectangular', panorama: scene.image_url ?? '' };
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
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.65rem',
          }}
        >
          Cliquez sur les points pour changer de pièce • Glissez pour naviguer • Molette pour zoomer • Échap pour quitter
        </Typography>
      )}
    </Box>
  );
}
