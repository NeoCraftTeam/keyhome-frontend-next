'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HotspotIcon from '@mui/icons-material/MyLocation';
import PlaceIcon from '@mui/icons-material/TouchApp';
import PreviewIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import type { TourHotspot } from '@/types';

// Dynamically import PanoramaViewer (Photo Sphere Viewer) to avoid SSR issues
const PanoramaViewer = dynamic(() => import('./PanoramaViewer'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 300,
        borderRadius: 2,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Chargement du viewer 360...
      </Typography>
    </Box>
  ),
});

interface TourSceneLocal {
  id?: string;
  title: string;
  file: File | null;
  previewUrl: string;
  hotspots: TourHotspot[];
}

interface AdTourHotspotEditorProps {
  scene: TourSceneLocal;
  allScenes: TourSceneLocal[];
  onUpdateHotspots: (hotspots: TourHotspot[]) => void;
}

export default function AdTourHotspotEditor({
  scene,
  allScenes,
  onUpdateHotspots,
}: AdTourHotspotEditorProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [placingMode, setPlacingMode] = useState(false);
  const [placingIndex, setPlacingIndex] = useState<number | null>(null);

  const otherScenes = allScenes.filter((s) => s.id !== scene.id && s.title);

  const addHotspot = useCallback(() => {
    const newHotspot: TourHotspot = {
      pitch: 0,
      yaw: 0,
      target_scene: otherScenes[0]?.id || '',
      label: 'Aller vers ' + (otherScenes[0]?.title || 'la pièce suivante'),
    };
    onUpdateHotspots([...scene.hotspots, newHotspot]);
  }, [scene.hotspots, otherScenes, onUpdateHotspots]);

  const updateHotspot = useCallback(
    (index: number, field: keyof TourHotspot, value: string | number) => {
      const newHotspots = [...scene.hotspots];
      newHotspots[index] = { ...newHotspots[index], [field]: value };
      onUpdateHotspots(newHotspots);
    },
    [scene.hotspots, onUpdateHotspots]
  );

  const removeHotspot = useCallback(
    (index: number) => {
      onUpdateHotspots(scene.hotspots.filter((_, i) => i !== index));
      if (placingIndex === index) {
        setPlacingMode(false);
        setPlacingIndex(null);
      }
    },
    [scene.hotspots, onUpdateHotspots, placingIndex]
  );

  const handlePanoramaClick = useCallback(
    (coords: { pitch: number; yaw: number }) => {
      if (!placingMode || placingIndex === null) return;

      const newHotspots = [...scene.hotspots];
      if (newHotspots[placingIndex]) {
        newHotspots[placingIndex] = {
          ...newHotspots[placingIndex],
          pitch: Math.round(coords.pitch * 100) / 100,
          yaw: Math.round(coords.yaw * 100) / 100,
        };
        onUpdateHotspots(newHotspots);
      }

      setPlacingMode(false);
      setPlacingIndex(null);
    },
    [placingMode, placingIndex, scene.hotspots, onUpdateHotspots]
  );

  const startPlacing = (index: number) => {
    setPlacingMode(true);
    setPlacingIndex(index);
    setShowViewer(true);
  };

  const viewerHotspots = scene.hotspots.map((h) => ({
    pitch: h.pitch,
    yaw: h.yaw,
    type: 'info' as const,
    text: h.label,
  }));

  const hasPreview = !!scene.previewUrl;

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          display="flex"
          alignItems="center"
          gap={1}
        >
          <HotspotIcon fontSize="small" color="primary" />
          Points d&apos;interaction
          {scene.hotspots.length > 0 && (
            <Chip
              label={scene.hotspots.length}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasPreview && (
            <Button
              size="small"
              variant={showViewer ? 'contained' : 'outlined'}
              startIcon={<PreviewIcon />}
              onClick={() => setShowViewer(!showViewer)}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                fontSize: '0.75rem',
              }}
            >
              {showViewer ? 'Masquer' : 'Aperçu 360'}
            </Button>
          )}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addHotspot}
            disabled={otherScenes.length === 0}
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              fontSize: '0.75rem',
            }}
          >
            Ajouter un lien
          </Button>
        </Box>
      </Box>

      {otherScenes.length === 0 && scene.hotspots.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 1.5 }}>
          <Typography variant="body2">
            Ajoutez au moins 2 pièces pour pouvoir créer des liens de navigation
            entre elles.
          </Typography>
        </Alert>
      )}

      {/* Panorama Viewer — monté uniquement quand ouvert pour éviter blocages */}
      <Collapse in={showViewer && hasPreview}>
        <Box sx={{ mb: 2 }}>
          {showViewer && hasPreview && (
            <PanoramaViewer
              imageUrl={scene.previewUrl}
              imageFile={scene.file}
              caption={scene.title || 'Aperçu 360°'}
              hotspots={viewerHotspots}
              onPanoramaClick={placingMode ? handlePanoramaClick : undefined}
              height={300}
              placingMode={placingMode}
            />
          )}
          {placingMode && placingIndex !== null && (
            <Alert
              severity="info"
              sx={{ mt: 1, borderRadius: 2 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setPlacingMode(false);
                    setPlacingIndex(null);
                  }}
                >
                  Annuler
                </Button>
              }
            >
              <Typography variant="body2">
                Orientez la vue (hors mode placement), puis cliquez sur « Placer
                ». En mode placement la rotation est désactivée : cliquez sur le
                panorama pour positionner le hotspot &quot;
                {scene.hotspots[placingIndex]?.label || `#${placingIndex + 1}`}
                &quot;.
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>

      {/* Hotspot list */}
      {scene.hotspots.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: 'italic', py: 1 }}
        >
          Aucun point d&apos;interaction. Ajoutez-en un pour permettre la
          navigation entre les pièces.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {scene.hotspots.map((hotspot, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor:
                  placingMode && placingIndex === idx
                    ? 'primary.main'
                    : 'divider',
                bgcolor:
                  placingMode && placingIndex === idx
                    ? 'rgba(13, 148, 136, 0.04)'
                    : 'action.hover',
                transition: 'all 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      size="small"
                      label="Label du bouton"
                      value={hotspot.label}
                      onChange={(e) =>
                        updateHotspot(idx, 'label', e.target.value)
                      }
                      fullWidth
                    />
                    <FormControl size="small" fullWidth>
                      <InputLabel>Destination</InputLabel>
                      <Select
                        label="Destination"
                        value={hotspot.target_scene}
                        onChange={(e) =>
                          updateHotspot(idx, 'target_scene', e.target.value)
                        }
                      >
                        {otherScenes.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Pitch"
                      type="number"
                      inputProps={{ step: 0.5, min: -90, max: 90 }}
                      value={hotspot.pitch}
                      onChange={(e) =>
                        updateHotspot(
                          idx,
                          'pitch',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      sx={{ width: 100 }}
                    />
                    <TextField
                      size="small"
                      label="Yaw"
                      type="number"
                      inputProps={{ step: 0.5, min: -180, max: 180 }}
                      value={hotspot.yaw}
                      onChange={(e) =>
                        updateHotspot(
                          idx,
                          'yaw',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      sx={{ width: 100 }}
                    />
                    {hasPreview && (
                      <Tooltip title="Placer sur le panorama" arrow>
                        <Button
                          size="small"
                          variant={
                            placingMode && placingIndex === idx
                              ? 'contained'
                              : 'outlined'
                          }
                          startIcon={<PlaceIcon />}
                          onClick={() => startPlacing(idx)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {placingMode && placingIndex === idx
                            ? 'En cours...'
                            : 'Placer'}
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Supprimer le point d'intérêt"
                  onClick={() => removeHotspot(idx)}
                  sx={{ color: 'text.secondary', mt: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
