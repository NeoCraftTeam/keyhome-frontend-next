import {
  Bed as BedIcon,
  LocalParking as ParkingIcon,
  Shower as ShowerIcon,
  Straighten as StraightenIcon,
} from '@mui/icons-material';
import {
  Box,
  FormControlLabel,
  Grid,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormFeaturesProps {
  values: AdFormValues;
  update: UpdateFn;
  errors: Record<string, string>;
}

export default function AdFormFeatures({ values, update, errors }: AdFormFeaturesProps) {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
        <StraightenIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Caractéristiques
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Adresse"
            placeholder="Ex: Rue de la Liberté, Bonanjo"
            value={values.adresse}
            onChange={(e) => update('adresse', e.target.value)}
            error={!!errors.adresse}
            helperText={errors.adresse}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Prix (FCFA)"
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.price}
            onChange={(e) => update('price', e.target.value)}
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">₣</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Surface"
            type="number"
            inputProps={{ min: 1, inputMode: 'numeric' }}
            value={values.surface_area}
            onChange={(e) => update('surface_area', e.target.value)}
            error={!!errors.surface_area}
            helperText={errors.surface_area}
            InputProps={{
              endAdornment: <InputAdornment position="end">m²</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            label="Chambres"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.bedrooms}
            onChange={(e) => update('bedrooms', e.target.value)}
            error={!!errors.bedrooms}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            label="SDB"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ShowerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.bathrooms}
            onChange={(e) => update('bathrooms', e.target.value)}
            error={!!errors.bathrooms}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={values.has_parking}
                onChange={(e) => update('has_parking', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ParkingIcon sx={{ fontSize: 18 }} />
                Parking
              </Box>
            }
            sx={{ pt: 1 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
