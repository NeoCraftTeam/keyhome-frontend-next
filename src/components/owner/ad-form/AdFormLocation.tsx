import type { AdType, City, Quarter } from '@/types';
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import type { AdFormValues, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

const cityFilter = createFilterOptions<City | string>();
const quarterFilter = createFilterOptions<Quarter | string>();

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
  isCreatingCity?: boolean;
  isCreatingQuarter?: boolean;
  cityCreateError?: string | null;
  onCityInputChange: (value: string) => void;
  onCityChange: (city: City | null) => void;
  onQuarterInputChange: (value: string) => void;
  onQuarterChange: (quarter: Quarter | null) => void;
  onCityCreate?: (name: string) => void;
  onQuarterCreate?: (name: string) => void;
  citySlotProps: object;
  renderCityOption: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: City
  ) => React.ReactNode;
  renderQuarterOption: (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: Quarter
  ) => React.ReactNode;
  cityInputSx: object;
  /** Hide the ad-type selector (used by wizard which has its own Step 1). */
  hideTypeSelector?: boolean;
}

const ADD_PREFIX = '__add__:';

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
  isCreatingCity = false,
  isCreatingQuarter = false,
  cityCreateError = null,
  onCityInputChange,
  onCityChange,
  onQuarterInputChange,
  onQuarterChange,
  onCityCreate,
  onQuarterCreate,
  citySlotProps,
  renderCityOption,
  renderQuarterOption,
  cityInputSx,
  hideTypeSelector = false,
}: AdFormLocationProps) {
  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        Localisation & Type
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete<City | string, false, false, true>
            freeSolo
            options={cities as (City | string)[]}
            getOptionLabel={(o) =>
              typeof o === 'string' ? o.replace(ADD_PREFIX, '') : o.name
            }
            value={selectedCity}
            inputValue={cityInput}
            onInputChange={(_, v) => onCityInputChange(v)}
            onChange={(_, v) => {
              if (typeof v === 'string') {
                const name = v.startsWith(ADD_PREFIX)
                  ? v.slice(ADD_PREFIX.length)
                  : v;
                onCityCreate?.(name);
              } else {
                onCityChange(v);
              }
            }}
            loading={isCitiesLoading || isCreatingCity}
            filterOptions={(options, params) => {
              const filtered = cityFilter(options, params);
              const { inputValue } = params;
              const alreadyExists = options.some(
                (o) =>
                  typeof o !== 'string' &&
                  o.name.toLowerCase() === inputValue.toLowerCase()
              );
              if (inputValue.length >= 2 && !alreadyExists) {
                filtered.push(`${ADD_PREFIX}${inputValue}` as unknown as City);
              }
              return filtered;
            }}
            noOptionsText={
              cityInput.length >= 2
                ? 'Appuyez sur Entrée pour ajouter cette ville'
                : 'Tapez pour rechercher'
            }
            slotProps={citySlotProps}
            renderOption={(props, opt) => {
              if (typeof opt === 'string' && opt.startsWith(ADD_PREFIX)) {
                const name = opt.slice(ADD_PREFIX.length);
                return (
                  <li {...props} key="__add_city__">
                    <em>+ Ajouter &laquo;{name}&raquo;</em>
                  </li>
                );
              }
              return renderCityOption(props, opt as City);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Ville"
                placeholder="Rechercher ou créer une ville…"
                sx={cityInputSx}
                error={!!cityCreateError}
                helperText={cityCreateError ?? undefined}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: isCreatingCity ? (
                      <CircularProgress size={16} />
                    ) : (
                      params.InputProps.endAdornment
                    ),
                  },
                }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Autocomplete<Quarter | string, false, false, true>
            freeSolo
            options={quarters as (Quarter | string)[]}
            getOptionLabel={(o) =>
              typeof o === 'string' ? o.replace(ADD_PREFIX, '') : o.name
            }
            value={selectedQuarter}
            inputValue={quarterInput}
            onInputChange={(_, v) => onQuarterInputChange(v)}
            onChange={(_, v) => {
              if (typeof v === 'string') {
                const name = v.startsWith(ADD_PREFIX)
                  ? v.slice(ADD_PREFIX.length)
                  : v;
                onQuarterCreate?.(name);
              } else {
                onQuarterChange(v);
                update('quarter_id', v?.id ?? '');
              }
            }}
            loading={isQuartersLoading || isCreatingQuarter}
            filterOptions={(options, params) => {
              const filtered = quarterFilter(options, params);
              const { inputValue } = params;
              const alreadyExists = options.some(
                (o) =>
                  typeof o !== 'string' &&
                  o.name.toLowerCase() === inputValue.toLowerCase()
              );
              if (
                inputValue.length >= 2 &&
                selectedCity?.id &&
                !alreadyExists
              ) {
                filtered.push(
                  `${ADD_PREFIX}${inputValue}` as unknown as Quarter
                );
              }
              return filtered;
            }}
            noOptionsText={
              !selectedCity?.id
                ? "Sélectionnez d'abord une ville"
                : quarterInput.trim().length < 2
                  ? 'Saisissez au moins 2 caractères'
                  : 'Aucun quartier trouvé'
            }
            disabled={!selectedCity?.id}
            slotProps={citySlotProps}
            renderOption={(props, opt) => {
              if (typeof opt === 'string' && opt.startsWith(ADD_PREFIX)) {
                const name = opt.slice(ADD_PREFIX.length);
                return (
                  <li {...props} key="__add_quarter__">
                    <em>+ Ajouter &laquo;{name}&raquo;</em>
                  </li>
                );
              }
              return renderQuarterOption(props, opt as Quarter);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Quartier"
                placeholder={
                  selectedCity
                    ? 'Rechercher ou créer un quartier…'
                    : "Sélectionnez d'abord une ville"
                }
                error={!!errors.quarter_id}
                helperText={errors.quarter_id}
                sx={cityInputSx}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: isCreatingQuarter ? (
                      <CircularProgress size={16} />
                    ) : (
                      params.InputProps.endAdornment
                    ),
                  },
                }}
              />
            )}
          />
        </Grid>
        {!hideTypeSelector && (
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
        )}
      </Grid>
    </Paper>
  );
}
