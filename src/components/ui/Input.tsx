'use client';

import { CheckCircleOutline } from '@mui/icons-material';
import {
  InputAdornment,
  TextField as MuiTextField,
  type TextFieldProps,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { radius, shadow, transition } from '../../theme/tokens';

type InputVariant = 'primary' | 'agent';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  /** Show success (green) state — adds checkmark adornment + green border */
  success?: boolean;
  /** Adapts focus ring + border to the teal agent palette */
  inputVariant?: InputVariant;
}

interface StyledProps {
  $success?: boolean;
  $agent?: boolean;
}

const StyledInput = styled(MuiTextField)<TextFieldProps & StyledProps>(({
  theme,
  $success,
  $agent,
}) => {
  const isDark = theme.palette.mode === 'dark';

  const focusBorder = $success
    ? theme.palette.success.main
    : $agent
      ? '#0D9488'
      : theme.palette.primary.main;

  const focusRing = $success
    ? shadow.successRing
    : $agent
      ? shadow.agentFocusRing
      : shadow.focusRing;

  return {
    '& .MuiOutlinedInput-root': {
      borderRadius: radius.sm,
      transition: transition.fast,
      backgroundColor: isDark
        ? alpha(theme.palette.background.paper, 0.5)
        : theme.palette.background.paper,

      '& fieldset': {
        borderColor: $success
          ? theme.palette.success.main
          : theme.palette.divider,
        transition: transition.fast,
      },

      '&:hover:not(.Mui-disabled) fieldset': {
        borderColor: $success
          ? theme.palette.success.main
          : $agent
            ? '#14B8A6'
            : theme.palette.primary.light,
      },

      '&.Mui-focused fieldset': {
        borderWidth: '2px',
        borderColor: focusBorder,
        boxShadow: focusRing,
      },

      '&.Mui-error fieldset': {
        borderColor: theme.palette.error.main,
      },

      '&.Mui-error.Mui-focused fieldset': {
        boxShadow: shadow.errorRing,
      },

      '&.Mui-disabled': {
        opacity: 0.55,
      },
    },

    '& .MuiInputLabel-root': {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',

      '&.Mui-focused': {
        color: focusBorder,
      },

      '&.Mui-error': {
        color: theme.palette.error.main,
      },
    },

    '& .MuiFormHelperText-root': {
      marginLeft: 0,
      marginTop: theme.spacing(0.5), // 4px — 0.5 × 8
      fontSize: '0.75rem',
      fontWeight: 500,
    },

    '& .MuiInputBase-input': {
      fontSize: '0.9375rem',
      padding: theme.spacing(1.5, 2), // 12px 16px
      fontFamily: '"Inter", sans-serif',
    },
  };
});

/**
 * Atomic Input component — wraps MUI TextField with full design-system compliance.
 *
 * States: default | hover | focus | error | success | disabled
 * Variants: "primary" (pink) | "agent" (teal) — controls focus ring + border colour
 *
 * @example
 * <Input label="Email" success={isValid} inputVariant="agent" />
 */
export function Input({
  success,
  inputVariant = 'primary',
  slotProps,
  ...props
}: InputProps) {
  const showSuccessIcon = success && !props.disabled;

  const mergedSlotProps: TextFieldProps['slotProps'] = {
    ...slotProps,
    input: {
      ...(slotProps?.input as object),
      ...(showSuccessIcon && {
        endAdornment: (
          <InputAdornment position="end">
            <CheckCircleOutline sx={{ color: 'success.main', fontSize: 20 }} />
          </InputAdornment>
        ),
      }),
    },
  };

  return (
    <StyledInput
      variant="outlined"
      $success={success}
      $agent={inputVariant === 'agent'}
      slotProps={mergedSlotProps}
      {...props}
    />
  );
}
