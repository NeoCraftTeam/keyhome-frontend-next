'use client';

import type { TourConfig } from '@/types';
import type { Pannellum, PannellumSceneConfig, PannellumViewer } from '@/types/pannellum.d';
import { Close, ViewInAr } from '@mui/icons-material';
import { Box, Chip, CircularProgress, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';

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

    // Reuse an existing script tag if one is already in the DOM.
    let script = document.querySelector(`script[src="${PANNELLUM_JS}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = PANNELLUM_JS;
      document.head.appendChild(script);
    }

    // Re-check: script may have already loaded between the check at the top and now.
    if (win['pannellum']) {
      resolve(win['pannellum'] as Pannellum);
      return;
    }

    const timeoutId = setTimeout(() => reject(new Error('Pannellum CDN load timeout (15 s)')), 15_000);

    script.addEventListener('load', () => {
      clearTimeout(timeoutId);
      resolve(win['pannellum'] as Pannellum);
    }, { once: true });

    script.addEventListener('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    }, { once: true });
  });
}

interface TourViewerProps {
  tourConfig: TourConfig;
  onClose: () => void;
}

export default function TourViewer({ tourConfig, onClose }: TourViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
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
      for (const scene of tourConfig.scenes) {
        const hotSpots = (scene.hotspots ?? []).map((h) => ({
          type: 'scene' as const,
          pitch: h.pitch,
          yaw: h.yaw,
          sceneId: h.target_scene,
          text: h.label,
          cssClass: 'kh-tour-hotspot',
        }));
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
        if (!loadingRef.current) return;
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
      const firstSceneId = tourConfig.default_scene && scenes[tourConfig.default_scene]
        ? tourConfig.default_scene
        : sceneIds[0];

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
        clearTimeout(safetyTimerRef.current ?? undefined);
        safetyTimerRef.current = null;
        loadingRef.current = false;
        setError('Impossible de charger les images du tour. Vérifiez votre connexion.');
        setIsLoading(false);
      });

      viewerRef.current.on('scenechange', () => {
        setCurrentScene(viewerRef.current?.getScene() ?? tourConfig.default_scene);
      });
    } catch {
      setError('Impossible de charger la visite virtuelle. Vérifiez votre connexion.');
      setIsLoading(false);
    }
  }, [tourConfig]);

  useEffect(() => {
    loadingRef.current = true;
    initViewer();
    return () => {
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

  const handleSceneJump = (sceneId: string) => {
    viewerRef.current?.loadScene(sceneId);
    setCurrentScene(sceneId);
  };

  return (
    <Box
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
        <IconButton onClick={onClose} size="small" sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
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
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', px: 4 }}>
            {error}
          </Typography>
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
          Cliquez et faites glisser pour naviguer • Molette pour zoomer • Échap pour quitter
        </Typography>
      )}
    </Box>
  );
}
