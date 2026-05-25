'use client';

import { Typography as MuiTypography, TypographyProps } from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Enterprise Grade Typography Component.
 * Forces the use of "Plus Jakarta Sans" for all headings (h1-h6)
 * and "Inter" for body text, ensuring visual consistency across all panels.
 */
const StyledTypography = styled(MuiTypography)<TypographyProps>(({
  variant,
}) => {
  const isHeading =
    variant &&
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(variant.toString());

  return {
    fontFamily: isHeading
      ? '"Plus Jakarta Sans", "Inter", sans-serif'
      : '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontWeight: isHeading ? 700 : 400,
    letterSpacing: isHeading ? '-0.02em' : 'normal',
    // Ensure smooth rendering
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };
});

export const Typography = (props: TypographyProps) => {
  return <StyledTypography {...props} />;
};
