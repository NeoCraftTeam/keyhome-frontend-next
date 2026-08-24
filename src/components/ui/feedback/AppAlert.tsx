'use client';

import { Alert, type AlertProps, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { dark, radius, semantic, transition } from '@/theme/tokens';

export type AppAlertSeverity = 'error' | 'success' | 'warning' | 'info';

export interface AppAlertColors {
  /** Tinted surface behind the alert (fond). */
  bg: string;
  /** Hairline border matching the severity. */
  border: string;
  /** Icon + title colour. */
  color: string;
}

/**
 * Resolve the severity colours for the active theme mode.
 *
 * Pure + exported so the colour logic is unit-testable: MUI `sx` compiles
 * to emotion classes that jsdom cannot compute, so we assert on this map
 * directly instead of the rendered styles. In dark mode we use brighter
 * severity colours and a stronger tint — the light-mode `0.08` tint over a
 * `#1D1D24` paper is effectively invisible, which is the bug this fixes.
 */
export function resolveAppAlertColors(
  severity: AppAlertSeverity,
  mode: 'light' | 'dark'
): AppAlertColors {
  if (mode === 'dark') {
    return {
      error: {
        bg: 'rgba(255,107,107,0.14)',
        border: 'rgba(255,107,107,0.32)',
        color: dark.errorBright,
      },
      success: {
        bg: 'rgba(76,175,80,0.14)',
        border: 'rgba(76,175,80,0.32)',
        color: dark.successBright,
      },
      warning: {
        bg: 'rgba(245,158,11,0.16)',
        border: 'rgba(245,158,11,0.34)',
        color: '#FBBF24',
      },
      info: {
        bg: 'rgba(96,165,250,0.16)',
        border: 'rgba(96,165,250,0.34)',
        color: '#60A5FA',
      },
    }[severity];
  }

  return {
    error: {
      bg: 'rgba(193,53,21,0.08)',
      border: 'rgba(193,53,21,0.20)',
      color: semantic.error,
    },
    success: {
      bg: 'rgba(0,138,5,0.08)',
      border: 'rgba(0,138,5,0.20)',
      color: semantic.success,
    },
    warning: {
      bg: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.24)',
      color: semantic.warning,
    },
    info: {
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.20)',
      color: semantic.info,
    },
  }[severity];
}

export interface AppAlertProps extends Omit<
  AlertProps,
  'severity' | 'variant' | 'children'
> {
  severity: AppAlertSeverity;
  title?: string;
  hint?: string;
  /** Plain-text body. Provide this OR `children`, not both. */
  message?: string;
  /** Rich content. When provided, it replaces the `message` body. */
  children?: ReactNode;
}

/**
 * Design-system Alert — always tinted (fond), theme-aware, safe text only.
 *
 * Two usage shapes:
 *  - `<AppAlert severity="error" message="…" hint="…" />` — structured text.
 *  - `<AppAlert severity="info">…rich JSX…</AppAlert>` — arbitrary content.
 *
 * Security: `message`, `title` and `hint` are rendered as text nodes. Never
 * use `dangerouslySetInnerHTML`. For error bodies from the API, pass a
 * sanitized string (`getSafeErrorMessage` / backend `message`).
 */
export default function AppAlert({
  severity,
  title,
  hint,
  message,
  children,
  sx,
  ...rest
}: AppAlertProps) {
  const theme = useTheme();
  const t = resolveAppAlertColors(
    severity,
    theme.palette.mode === 'dark' ? 'dark' : 'light'
  );

  return (
    <Alert
      severity={severity}
      role={severity === 'error' ? 'alert' : 'status'}
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      sx={
        {
          borderRadius: `${radius.md}px`,
          border: `1px solid ${t.border}`,
          bgcolor: t.bg,
          color: t.color,
          transition: transition.polish,
          '& .MuiAlert-icon': { color: t.color },
          ...sx,
        } as AlertProps['sx']
      }
      {...rest}
    >
      {title ? (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
          {title}
        </Typography>
      ) : null}
      {children ?? (
        <Typography
          variant="body2"
          sx={{ color: 'text.primary', lineHeight: 1.5 }}
        >
          {message}
        </Typography>
      )}
      {hint ? (
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            opacity: 0.92,
            color: 'text.secondary',
            lineHeight: 1.45,
          }}
        >
          {hint}
        </Typography>
      ) : null}
    </Alert>
  );
}

export function AppAlertHintBox({ hint }: { hint: string }) {
  return (
    <Box
      sx={{
        mt: 1,
        p: 1.25,
        borderRadius: `${radius.sm}px`,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {hint}
      </Typography>
    </Box>
  );
}
