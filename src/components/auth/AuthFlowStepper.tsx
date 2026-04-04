'use client';

import CheckIcon from '@mui/icons-material/Check';
import { Box, Typography } from '@mui/material';
import { Fragment } from 'react';

export type AuthFlowStepperProps = {
  /** Libellés affichés à côté des pastilles (masqués sur très petit écran). */
  labels: string[];
  /** Étape courante, 0-based (0 = première). Les étapes précédentes sont cochées. */
  activeStep: number;
  /** Optional accent color override (defaults to theme primary.main). */
  accentColor?: string;
};

/**
 * Stepper compact pour inscription / OTP : pastilles centrées, lisible en clair et sombre.
 */
export default function AuthFlowStepper({
  labels,
  activeStep,
  accentColor,
}: AuthFlowStepperProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 0.5,
        mb: 3,
      }}
    >
      {labels.map((label, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        const isPending = idx > activeStep;

        return (
          <Fragment key={label}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flex: idx < labels.length - 1 ? 1 : 'none',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={(theme) => {
                    const inactiveBg =
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[800]
                        : theme.palette.grey[200];
                    const inactiveFg =
                      theme.palette.mode === 'dark'
                        ? theme.palette.grey[400]
                        : theme.palette.grey[700];

                    return {
                      width: 28,
                      height: 28,
                      minWidth: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      ...(isCompleted || isActive
                        ? {
                            bgcolor: accentColor ?? 'primary.main',
                            color: accentColor
                              ? '#fff'
                              : theme.palette.primary.contrastText,
                          }
                        : {
                            bgcolor: inactiveBg,
                            color: inactiveFg,
                          }),
                    };
                  }}
                >
                  {isCompleted ? (
                    <CheckIcon
                      sx={{ fontSize: 18, display: 'block' }}
                      aria-hidden
                    />
                  ) : (
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        lineHeight: 1,
                      }}
                    >
                      {idx + 1}
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontWeight: isActive ? 700 : 400,
                    color: isPending ? 'text.disabled' : 'text.primary',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {label}
                </Typography>
              </Box>
              {idx < labels.length - 1 && (
                <Box
                  sx={(theme) => ({
                    flex: 1,
                    height: 2,
                    minWidth: 8,
                    borderRadius: 1,
                    alignSelf: 'center',
                    bgcolor:
                      idx < activeStep
                        ? (accentColor ?? theme.palette.primary.main)
                        : theme.palette.mode === 'dark'
                          ? theme.palette.grey[700]
                          : theme.palette.grey[300],
                  })}
                />
              )}
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
}
