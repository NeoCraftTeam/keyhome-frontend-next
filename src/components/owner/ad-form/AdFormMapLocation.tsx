import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { AdFormValues, UpdateFn } from './types';
import {
  AD_FORM_MAP_DEFAULT_LAT,
  AD_FORM_MAP_DEFAULT_LNG,
  sectionSx,
  sectionTitleSx,
} from './types';

const MapPicker = dynamic(() => import('../MapPicker'), {
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
        Chargement de la carte...
      </Typography>
    </Box>
  ),
});

interface AdFormMapLocationProps {
  values: AdFormValues;
  update: UpdateFn;
}

export default function AdFormMapLocation({
  values,
  update,
}: AdFormMapLocationProps) {
  const [geoState, setGeoState] = useState<
    'idle' | 'loading' | 'done' | 'denied'
  >('idle');

  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation) return;
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        update('latitude', lat);
        update('longitude', lng);
        setGeoState('done');
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasPosition =
    values.latitude !== AD_FORM_MAP_DEFAULT_LAT &&
    values.longitude !== AD_FORM_MAP_DEFAULT_LNG;

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        <MapIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Position sur la carte
      </Typography>

      {/* GPS prompt — facultatif */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={500}>
            Le logement se trouve à votre position actuelle ?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Facultatif — vous pouvez aussi cliquer directement sur la carte.
          </Typography>
        </Box>
        {geoState === 'done' ? (
          <Chip
            label="Position appliquée ✓"
            color="success"
            size="small"
            sx={{ flexShrink: 0 }}
          />
        ) : geoState === 'denied' ? (
          <Chip
            label="Accès refusé"
            color="error"
            size="small"
            sx={{ flexShrink: 0 }}
          />
        ) : (
          <Button
            size="small"
            variant="outlined"
            startIcon={<MyLocationIcon fontSize="small" />}
            loading={geoState === 'loading'}
            onClick={handleUseCurrentPosition}
            sx={{ flexShrink: 0, borderRadius: 1.5, textTransform: 'none' }}
          >
            Utiliser ma position
          </Button>
        )}
      </Box>

      <MapPicker
        latitude={hasPosition ? values.latitude : null}
        longitude={hasPosition ? values.longitude : null}
        onLocationChange={(lat, lng) => {
          update('latitude', lat);
          update('longitude', lng);
        }}
        height={320}
      />
    </Paper>
  );
}
