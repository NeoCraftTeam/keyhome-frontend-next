import MapIcon from '@mui/icons-material/Map';
import { Box, Paper, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
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
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        <MapIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Position sur la carte
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Positionnez votre bien sur la carte pour que les locataires puissent le
        localiser facilement.
      </Typography>
      <MapPicker
        latitude={
          values.latitude !== AD_FORM_MAP_DEFAULT_LAT ? values.latitude : null
        }
        longitude={
          values.longitude !== AD_FORM_MAP_DEFAULT_LNG ? values.longitude : null
        }
        onLocationChange={(lat, lng) => {
          update('latitude', lat);
          update('longitude', lng);
        }}
        height={320}
      />
    </Paper>
  );
}
