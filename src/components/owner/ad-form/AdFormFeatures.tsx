import {
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

export default function AdFormFeatures({
  values,
  update,
  errors,
}: AdFormFeaturesProps) {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        Caractéristiques
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="medium"
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
            size="medium"
            label="Prix (FCFA)"
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.price}
            onChange={(e) => update('price', e.target.value)}
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">₣</InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            size="medium"
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
            size="medium"
            label="Chambres"
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
            size="medium"
            label="SDB"
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
            label="Parking"
            sx={{ pt: 1 }}
          />
        </Grid>
      </Grid>

      {/* ═══ Proximité & Accessibilité ═══ */}
      <Typography
        variant="subtitle1"
        sx={{
          ...sectionTitleSx,
          mt: 3,
        }}
      >
        Proximité & Accessibilité
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1.5, display: 'block' }}
      >
        Distances approximatives depuis le bien (en mètres). Laisser vide si non
        applicable.
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Route principale"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_main_road_m}
            onChange={(e) => update('distance_main_road_m', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Magasins / Marchés"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_shops_m}
            onChange={(e) => update('distance_shops_m', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Transport en commun"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_transport_m}
            onChange={(e) => update('distance_transport_m', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="École / Université"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_school_m}
            onChange={(e) => update('distance_school_m', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Hôpital / Clinique"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_hospital_m}
            onChange={(e) => update('distance_hospital_m', e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
