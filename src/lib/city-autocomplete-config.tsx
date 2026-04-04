'use client';

import LocationOn from '@mui/icons-material/LocationOn';
import { Typography } from '@mui/material';
import type { City } from '@/types';

/**
 * Shared config for city Autocomplete components across the app.
 * Rounded inputs match standard MUI TextField (Keyhome "premium" feel); list panel is softly rounded.
 *
 * IMPORTANT: all color values use MUI theme tokens (strings) rather than computed CSS values
 * so they are resolved from the render-time theme context. This prevents the dark-dropdown-on-
 * light-panel bug that occurs when this hook is called outside a nested ThemeProvider but the
 * Autocomplete renders inside one (e.g. the register page).
 */
export function useCityAutocompleteConfig() {
  /** Same radius as `theme.ts` → MuiTextField → MuiOutlinedInput-root (10px). */
  const inputRadiusPx = 10;
  const panelRadiusPx = 12;

  const slotProps = {
    popper: {
      modifiers: [{ name: 'offset', options: { offset: [0, 6] } }],
    },
    paper: {
      sx: {
        borderRadius: `${panelRadiusPx}px`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        border: '1px solid',
        borderColor: 'divider',
        mt: 0.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      },
    },
    listbox: {
      sx: {
        py: 0.5,
        '& .MuiAutocomplete-option': {
          px: 2.5,
          py: 1.5,
          gap: 1.25,
          fontSize: 14,
          borderRadius: `${Math.max(panelRadiusPx - 6, 6)}px`,
          mx: 0.5,
          my: 0.25,
          '&[aria-selected="true"]': {
            bgcolor: 'action.selected',
            color: 'primary.main',
            fontWeight: 600,
          },
          '&.Mui-focused': { bgcolor: 'action.hover' },
        },
      },
    },
  };

  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: City
  ) => {
    const { key, ...restProps } = props;
    const isSelected =
      props['aria-selected'] === true || props['aria-selected'] === 'true';
    return (
      <li key={key ?? option.id} {...restProps}>
        <LocationOn
          sx={{
            fontSize: 16,
            color: isSelected ? 'primary.main' : 'text.disabled',
            mr: 0.5,
          }}
        />
        {option.name}
      </li>
    );
  };

  const renderOptionFreeSolo = (
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
    option: City | string
  ) => {
    const { key, ...restProps } = props;
    const isSelected =
      props['aria-selected'] === true || props['aria-selected'] === 'true';
    return (
      <li
        key={key ?? (typeof option === 'string' ? option : option.id)}
        {...restProps}
      >
        <LocationOn
          sx={{
            fontSize: 16,
            color: isSelected ? 'primary.main' : 'text.disabled',
            mr: 0.5,
          }}
        />
        <Typography component="span" sx={{ fontSize: 14 }}>
          {typeof option === 'string' ? option : option.name}
        </Typography>
      </li>
    );
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: `${inputRadiusPx}px`,
      overflow: 'hidden',
    },
  };

  return { slotProps, renderOption, renderOptionFreeSolo, inputSx };
}
