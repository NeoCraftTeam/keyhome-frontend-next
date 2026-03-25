import {
  Bed as BedIcon,
  DirectionsBus as BusIcon,
  LocalHospital as HospitalIcon,
  LocalParking as ParkingIcon,
  NearMe as NearMeIcon,
  School as SchoolIcon,
  Shower as ShowerIcon,
  ShoppingCart as ShopIcon,
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

      {/* ═══ Proximité & Accessibilité ═══ */}
      <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
        <NearMeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Proximité & Accessibilité
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
        Distances approximatives depuis le bien (en mètres). Laisser vide si non applicable.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Route principale"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_main_road_m}
            onChange={(e) => update('distance_main_road_m', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NearMeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Magasins / Marchés"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_shops_m}
            onChange={(e) => update('distance_shops_m', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ShopIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Transport en commun"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_transport_m}
            onChange={(e) => update('distance_transport_m', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="École / Université"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_school_m}
            onChange={(e) => update('distance_school_m', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Hôpital / Clinique"
            type="number"
            inputProps={{ min: 0, max: 99999, inputMode: 'numeric' }}
            value={values.distance_hospital_m}
            onChange={(e) => update('distance_hospital_m', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HospitalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">m</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
