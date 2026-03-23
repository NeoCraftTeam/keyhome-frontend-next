import { LocationOn as LocationIcon } from '@mui/icons-material';
import {
  Autocomplete,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { AdType, City, Quarter } from '@/types';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

interface AdFormLocationProps {
  values: AdFormValues;
  update: UpdateFn;
  errors: Record<string, string>;
  cities: City[];
  quarters: Quarter[];
  adTypes: AdType[];
  selectedCity: City | null;
  selectedQuarter: Quarter | null;
  cityInput: string;
  quarterInput: string;
  isCitiesLoading: boolean;
  isQuartersLoading: boolean;
  onCityInputChange: (value: string) => void;
  onCityChange: (city: City | null) => void;
  onQuarterInputChange: (value: string) => void;
  onQuarterChange: (quarter: Quarter | null) => void;
  citySlotProps: object;
  renderCityOption: (props: React.HTMLAttributes<HTMLLIElement>, option: City) => React.ReactNode;
  cityInputSx: object;
}

export default function AdFormLocation({
  values,
  update,
  errors,
  cities,
  quarters,
  adTypes,
  selectedCity,
  selectedQuarter,
  cityInput,
  quarterInput,
  isCitiesLoading,
  isQuartersLoading,
  onCityInputChange,
  onCityChange,
  onQuarterInputChange,
  onQuarterChange,
  citySlotProps,
  renderCityOption,
  cityInputSx,
}: AdFormLocationProps) {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        <LocationIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Localisation & Type
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={cities}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
            value={selectedCity}
            inputValue={cityInput}
            onInputChange={(_, v) => onCityInputChange(v)}
            onChange={(_, v) => onCityChange(v)}
            loading={isCitiesLoading}
            filterOptions={(x) => x}
            noOptionsText="Aucune ville"
            slotProps={citySlotProps}
            renderOption={(props, opt) => renderCityOption(props, opt)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ville"
                placeholder="Rechercher une ville..."
                sx={cityInputSx}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete
            options={quarters}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
            value={selectedQuarter}
            inputValue={quarterInput}
            onInputChange={(_, v) => onQuarterInputChange(v)}
            onChange={(_, v) => {
              onQuarterChange(v);
              update('quarter_id', v?.id ?? '');
            }}
            loading={isQuartersLoading}
            filterOptions={(x) => x}
            noOptionsText="Aucun quartier"
            disabled={!selectedCity?.id}
            slotProps={citySlotProps}
            renderOption={(props, opt) => (
              <li {...props} key={opt.id}>
                {opt.name} {opt.city_name ? `(${opt.city_name})` : ''}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Quartier"
                placeholder="Sélectionnez d'abord une ville"
                error={!!errors.quarter_id}
                helperText={errors.quarter_id}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth error={!!errors.type_id}>
            <InputLabel>Type d&apos;annonce</InputLabel>
            <Select
              value={values.type_id}
              label="Type d'annonce"
              onChange={(e) => update('type_id', e.target.value)}
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {adTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
}
