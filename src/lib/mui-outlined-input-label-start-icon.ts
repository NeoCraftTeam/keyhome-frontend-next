import type { InputLabelProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Only adjust the non-shrunk (in-field) position so the label clears the left icon.
 * Do not override `.MuiInputLabel-shrink` — that breaks the float animation and notch.
 */
const outlinedStartIconInputLabelSx: SxProps<Theme> = {
  '&:not(.MuiInputLabel-shrink)': {
    transform: 'translate(42px, 16px) scale(1)',
  },
};

/**
 * @param shrink — use `useOutlinedInputLabelShrink(value.length > 0).shrink` (or equivalent).
 */
export function outlinedStartIconInputLabelProps(
  shrink: boolean
): Partial<InputLabelProps> {
  return {
    shrink,
    sx: outlinedStartIconInputLabelSx,
  };
}

/**
 * Merge with Autocomplete `params.InputLabelProps`; forces `shrink` from parent logic.
 */
export function mergeOutlinedStartIconInputLabelProps(
  base: InputLabelProps | undefined,
  shrink: boolean
): InputLabelProps {
  const { shrink: _ignored, sx: baseSx, ...rest } = base ?? {};

  return {
    ...rest,
    shrink,
    sx: [baseSx, outlinedStartIconInputLabelSx] as SxProps<Theme>,
  };
}
