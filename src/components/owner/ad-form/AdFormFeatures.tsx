import { CURRENCY_SYMBOL } from '@/lib/constants';
import {
  FormControlLabel,
  Grid,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import type { AdFormValues, UpdateFn } from './types';
import { adFormText, sectionSx, sectionTitleSx } from './types';

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
        {/* Adresse — full width */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="medium"
            label="Adresse"
            placeholder="Ex: Rue de la Liberté, Bonanjo"
            value={adFormText(values.adresse)}
            onChange={(e) => update('adresse', e.target.value)}
            error={!!errors.adresse}
            helperText={errors.adresse}
          />
        </Grid>

        {/* Prix — always full width */}
        <Grid size={{ xs: 12 }}>
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
                <InputAdornment position="start">
                  {CURRENCY_SYMBOL}
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Surface / Chambres / Salles de bain */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Surface (m²)"
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
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Chambres"
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.bedrooms}
            onChange={(e) => update('bedrooms', e.target.value)}
            error={!!errors.bedrooms}
            helperText={errors.bedrooms}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField
            fullWidth
            size="medium"
            label="Salles de bain"
            type="number"
            inputProps={{ min: 0, inputMode: 'numeric' }}
            value={values.bathrooms}
            onChange={(e) => update('bathrooms', e.target.value)}
            error={!!errors.bathrooms}
            helperText={errors.bathrooms}
          />
        </Grid>

        {/* Parking */}
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={values.has_parking}
                onChange={(e) => update('has_parking', e.target.checked)}
                color="primary"
              />
            }
            label="Parking"
          />
        </Grid>

        {/* Période — below Parking, only for location */}
        {values.transaction_type === 'location' && (
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Période de facturation
            </Typography>
            <ToggleButtonGroup
              value={values.price_period}
              exclusive
              onChange={(_e, val) => {
                if (val !== null) update('price_period', val);
              }}
              size="medium"
              color="primary"
            >
              <ToggleButton value="mois" aria-label="par mois" sx={{ px: 4 }}>
                / mois
              </ToggleButton>
              <ToggleButton value="jour" aria-label="par jour" sx={{ px: 4 }}>
                / jour
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        )}
      </Grid>

      {/*
        Proximité & Accessibilité — supprimé (Juin 2026).
        Les distances aux commerces / transports / écoles / hôpitaux sont
        désormais calculées serveur via NeighborhoodScorecardService
        (`/api/v1/ads/{ad}/keyscore`). Le détail-annonce affiche la
        section « Quartier » alimentée par ces données — pas besoin de
        saisie manuelle ici.
      */}
    </Paper>
  );
}
