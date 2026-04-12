'use client';

import { geoService, type OrsProfile } from '@/services/geo.service';
import AccessTime from '@mui/icons-material/AccessTime';
import Close from '@mui/icons-material/Close';
import DirectionsBike from '@mui/icons-material/DirectionsBike';
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import DirectionsWalk from '@mui/icons-material/DirectionsWalk';
import Accessible from '@mui/icons-material/Accessible';
import RadioButtonChecked from '@mui/icons-material/RadioButtonChecked';
import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import mapboxgl from 'mapbox-gl';
import { type RefObject, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_ID = 'isochrone-source';
const FILL_ID = 'isochrone-fill';
const LINE_ID = 'isochrone-line';

const PROFILE_OPTIONS: {
  value: OrsProfile;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'foot-walking',
    label: 'Pied',
    icon: <DirectionsWalk sx={{ fontSize: 18 }} />,
  },
  {
    value: 'driving-car',
    label: 'Voiture',
    icon: <DirectionsCar sx={{ fontSize: 18 }} />,
  },
  {
    value: 'cycling-regular',
    label: 'Vélo',
    icon: <DirectionsBike sx={{ fontSize: 18 }} />,
  },
  {
    value: 'wheelchair',
    label: 'Fauteuil',
    icon: <Accessible sx={{ fontSize: 18 }} />,
  },
];

const RANGE_MARKS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 45, label: '45' },
  { value: 60, label: '60 min' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function removeLayers(map: mapboxgl.Map): void {
  if (map.getLayer(FILL_ID)) map.removeLayer(FILL_ID);
  if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  mapRef: RefObject<mapboxgl.Map | null>;
}

export default function IsochroneFilter({ mapRef }: Props) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<OrsProfile>('foot-walking');
  const [range, setRange] = useState(15);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    const map = mapRef.current;
    if (map) removeLayers(map);
    setActive(false);
    setError(null);
  }, [mapRef]);

  const compute = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    // Use current map center as reference point
    const center = map.getCenter();
    setLoading(true);
    setError(null);

    try {
      const res = await geoService.getIsochrone(
        center.lat,
        center.lng,
        profile,
        range
      );
      const geojson = res.data.geojson;

      removeLayers(map);

      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

      // Insert below cluster layers when they exist so the polygon renders under ad pins
      const beforeId = map.getLayer('clusters') ? 'clusters' : undefined;

      map.addLayer(
        {
          id: FILL_ID,
          type: 'fill',
          source: SOURCE_ID,
          paint: {
            'fill-color': '#F6475F',
            'fill-opacity': 0.12,
          },
        },
        beforeId
      );

      map.addLayer(
        {
          id: LINE_ID,
          type: 'line',
          source: SOURCE_ID,
          paint: {
            'line-color': '#F6475F',
            'line-width': 2.5,
            'line-opacity': 0.8,
          },
        },
        beforeId
      );

      setActive(true);
    } catch {
      setError('Service de zones indisponible.');
    } finally {
      setLoading(false);
    }
  }, [mapRef, profile, range]);

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 32,
        right: 10,
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Expanded panel */}
      <Collapse in={open} unmountOnExit>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            p: 2,
            width: 240,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.primary">
              Zone accessible depuis le centre
            </Typography>
            <IconButton
              size="small"
              aria-label="Fermer le filtre"
              onClick={() => setOpen(false)}
              sx={{ ml: 1 }}
            >
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>

          {/* Profile selector */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.75 }}
          >
            Mode de déplacement
          </Typography>
          <ToggleButtonGroup
            value={profile}
            exclusive
            onChange={(_, v) => {
              if (v) setProfile(v);
            }}
            size="small"
            sx={{
              mb: 2,
              display: 'flex',
              '& .MuiToggleButton-root': { flex: 1, py: 0.5, fontSize: 10 },
            }}
          >
            {PROFILE_OPTIONS.map((p) => (
              <Tooltip key={p.value} title={p.label} arrow>
                <ToggleButton value={p.value} aria-label={p.label}>
                  {p.icon}
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>

          {/* Range slider */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1 }}
          >
            Durée : <strong>{range} min</strong>
          </Typography>
          <Slider
            value={range}
            onChange={(_, v) => setRange(v as number)}
            min={5}
            max={60}
            step={null}
            marks={RANGE_MARKS}
            size="small"
            sx={{
              mb: 2,
              color: 'primary.main',
              '& .MuiSlider-markLabel': { fontSize: 9, mt: 0.5 },
            }}
          />

          {/* Error */}
          {error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: 'block', mb: 1 }}
            >
              {error}
            </Typography>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              component="button"
              onClick={compute}
              disabled={loading}
              sx={{
                flex: 1,
                py: 0.75,
                px: 1,
                bgcolor: 'primary.main',
                color: '#fff',
                border: 'none',
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                '&:hover:not(:disabled)': { opacity: 0.88 },
              }}
            >
              {loading ? (
                <CircularProgress size={12} sx={{ color: '#fff' }} />
              ) : (
                <AccessTime sx={{ fontSize: 13 }} />
              )}
              {loading ? 'Calcul…' : 'Calculer'}
            </Box>

            {active && (
              <Box
                component="button"
                onClick={clear}
                sx={{
                  py: 0.75,
                  px: 1,
                  bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                  color: 'error.main',
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.error.main, 0.3),
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Effacer
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Toggle button */}
      <Tooltip
        title={open ? 'Fermer' : 'Zone accessible'}
        placement="left"
        arrow
      >
        <Box
          component="button"
          onClick={() => setOpen((v) => !v)}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: active ? 'primary.main' : 'background.paper',
            color: active ? '#fff' : 'text.secondary',
            border: '1px solid',
            borderColor: active ? 'primary.main' : 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: active
                ? 'primary.dark'
                : (t: { palette: { action: { hover: string } } }) =>
                    t.palette.action.hover,
            },
          }}
        >
          <RadioButtonChecked sx={{ fontSize: 20 }} />
        </Box>
      </Tooltip>
    </Box>
  );
}
