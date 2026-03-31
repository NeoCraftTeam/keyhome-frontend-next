'use client';

import { TextField as MuiTextField, TextFieldProps } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { radius, shadow, spacing, transition } from '../../theme/tokens';

/**
 * Enterprise Grade TextField Component.
 * Standardizes input fields with consistent radii (radius.sm = 8px),
 * focus states, and typography across all panels.
 */
const StyledTextField = styled(MuiTextField)<TextFieldProps>(({ theme }) => {
  const isDarkMode = theme.palette.mode === 'dark';

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: radius.sm,
      transition: transition.fast,
      backgroundColor: isDarkMode
        ? alpha(theme.palette.background.paper, 0.5)
        : theme.palette.background.paper,

      '& fieldset': {
        borderColor: theme.palette.divider,
        transition: transition.fast,
      },

      '&:hover fieldset': {
        borderColor: theme.palette.primary.light,
      },

      '&.Mui-focused fieldset': {
        borderWidth: '2px',
        borderColor: theme.palette.primary.main,
        boxShadow: shadow.focusRing,
      },

      '&.Mui-error fieldset': {
        borderColor: theme.palette.error.main,
      },
    },

    '& .MuiInputLabel-root': {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',

      '&.Mui-focused': {
        color: theme.palette.primary.main,
      },
    },

    '& .MuiFormHelperText-root': {
      marginLeft: 0,
      marginTop: spacing.xs * 8, // 4px — spacing.xs = 0.5 × 8
      fontSize: '0.75rem',
      fontWeight: 500,
    },

    '& .MuiInputBase-input': {
      fontSize: '0.9375rem',
      padding: '12px 16px',
      fontFamily: '"Inter", sans-serif',
    },
  };
});

export const TextField = (props: TextFieldProps) => {
  return <StyledTextField variant="outlined" {...props} />;
};
