'use client';

import { LocationOn } from '@mui/icons-material';
import { alpha, Typography, useTheme } from '@mui/material';
import type { City } from '@/types';

/**
 * Shared config for city Autocomplete components across the app.
 * Ensures consistent styling: no rounded corners, flush dropdown, LocationOn icon.
 */
export function useCityAutocompleteConfig() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const slotProps = {
    popper: {
      modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
    },
    paper: {
      sx: {
        borderRadius: 0,
        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        border: '1px solid',
        borderColor: 'divider',
        borderTop: 'none',
        mt: 0,
        overflow: 'hidden',
        bgcolor: isDark ? theme.palette.background.paper : '#fff',
      },
    },
    listbox: {
      sx: {
        py: 0,
        '& .MuiAutocomplete-option': {
          px: 2.5,
          py: 1.5,
          gap: 1.25,
          fontSize: 14,
          '&[aria-selected="true"]': {
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
            color: 'primary.main',
            fontWeight: 600,
          },
          '&.Mui-focused': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
        },
      },
    },
  };

  const renderOption = (
    props: React.HTMLAttributes<HTMLLIElement> & { 'aria-selected'?: boolean; key?: React.Key },
    option: City,
  ) => {
    const { key, ...restProps } = props;
    return (
      <li key={key ?? option.id} {...restProps}>
        <LocationOn
          sx={{
            fontSize: 16,
            color: props['aria-selected'] ? 'primary.main' : 'text.disabled',
            mr: 0.5,
          }}
        />
        {option.name}
      </li>
    );
  };

  const renderOptionFreeSolo = (
    props: React.HTMLAttributes<HTMLLIElement> & { 'aria-selected'?: boolean; key?: React.Key },
    option: City | string,
  ) => {
    const { key, ...restProps } = props;
    return (
      <li key={key ?? (typeof option === 'string' ? option : option.id)} {...restProps}>
        <LocationOn
          sx={{
            fontSize: 16,
            color: props['aria-selected'] ? 'primary.main' : 'text.disabled',
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
      borderRadius: 0,
      '&.Mui-focused fieldset': {
        boxShadow: 'none',
      },
    },
  };

  return { slotProps, renderOption, renderOptionFreeSolo, inputSx };
}
