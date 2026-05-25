'use client';

import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCityAutocompleteConfig } from '@/lib/city-autocomplete-config';
import { citiesService } from '@/services/cities.service';
import type { City } from '@/types';
import type { SxProps, Theme } from '@mui/material/styles';

export interface CityAutocompleteProps {
  /** Currently selected city (controlled). */
  value: City | null;
  /** Fired when user selects or clears a city. */
  onChange: (city: City | null) => void;
  /** Optional label. Default: "Ville". */
  label?: string;
  /** Optional placeholder. */
  placeholder?: string;
  /** MUI size. Default: "small". */
  size?: 'small' | 'medium';
  /** Extra sx for the root TextField. */
  sx?: SxProps<Theme>;
  /** If true, field shows required asterisk. */
  required?: boolean;
  /** Error state. */
  error?: boolean;
  /** Helper text. */
  helperText?: string;
  /** Disable the component. */
  disabled?: boolean;
}

/**
 * Reusable city autocomplete that encapsulates:
 * - Debounced city search query
 * - Shared visual config (rounded inputs, styled options)
 *
 * Consumers only need `value` + `onChange`.
 */
export default function CityAutocomplete({
  value,
  onChange,
  label = 'Ville',
  placeholder = 'Rechercher une ville…',
  size = 'small',
  sx,
  required,
  error,
  helperText,
  disabled,
}: CityAutocompleteProps) {
  const {
    slotProps: citySlotProps,
    renderOption: renderCityOption,
    inputSx: cityInputSx,
  } = useCityAutocompleteConfig();

  const [inputValue, setInputValue] = useState(value?.name || '');
  const [debounced, setDebounced] = useState(inputValue);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value?.name || '');
  }, [value]);

  // Debounce input for API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: citiesData, isFetching } = useQuery({
    queryKey: ['cities', debounced],
    queryFn: () => citiesService.list({ q: debounced, per_page: 20 }),
    enabled: debounced.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const options = citiesData?.data || [];

  return (
    <Autocomplete
      size={size}
      options={options}
      forcePopupIcon={false}
      getOptionLabel={(opt) => opt.name}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      value={value}
      onChange={(_, val) => {
        onChange(val);
        setInputValue(val?.name || '');
      }}
      inputValue={inputValue}
      onInputChange={(_, val, reason) => {
        if (reason !== 'reset') {
          setInputValue(val);
        }
      }}
      filterOptions={(x) => x}
      loading={isFetching}
      noOptionsText={
        inputValue.length < 1
          ? 'Tapez pour rechercher…'
          : 'Aucune ville trouvée'
      }
      loadingText="Recherche…"
      slotProps={citySlotProps}
      renderOption={(props, option) => renderCityOption(props, option)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          sx={{ ...cityInputSx, ...sx }}
          InputProps={{
            ...params.InputProps,
            endAdornment: params.InputProps.endAdornment,
          }}
        />
      )}
    />
  );
}
