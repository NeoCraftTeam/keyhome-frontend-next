import { useCallback, useState } from 'react';

/**
 * Outlined TextField + startAdornment can make MUI shrink the label while empty.
 * Drive shrink explicitly: only when there is content or the field is focused.
 */
export function useOutlinedInputLabelShrink(hasContent: boolean): {
  shrink: boolean;
  onFocus: () => void;
  onBlur: () => void;
} {
  const [focused, setFocused] = useState(false);

  const shrink = hasContent || focused;

  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return { shrink, onFocus, onBlur };
}
