'use client';

import { Alert, type AlertProps, Box, Typography } from '@mui/material';
import { radius, semantic, shadow, transition } from '@/theme/tokens';

type AppAlertSeverity = 'error' | 'success' | 'warning' | 'info';

const SEVERITY = {
  error: {
    bg: 'rgba(193,53,21,0.08)',
    border: 'rgba(193,53,21,0.18)',
    color: semantic.error,
    ring: shadow.errorRing,
  },
  success: {
    bg: 'rgba(0,138,5,0.08)',
    border: 'rgba(0,138,5,0.18)',
    color: semantic.success,
    ring: shadow.successRing,
  },
  warning: {
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.22)',
    color: semantic.warning,
    ring: '0 0 0 4px rgba(245,158,11,0.12)',
  },
  info: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.18)',
    color: semantic.info,
    ring: '0 0 0 4px rgba(59,130,246,0.12)',
  },
} as const;

export interface AppAlertProps extends Omit<AlertProps, 'severity'> {
  severity: AppAlertSeverity;
  title?: string;
  hint?: string;
  message: string;
}

/**
 * Design-system Alert — always with background (fond), safe text only.
 *
 * Security: `message` and `hint` are rendered as text nodes. Never
 * use `dangerouslySetInnerHTML`. Callers must pass sanitized strings
 * from `getSafeErrorMessage` / backend `message` field.
 */
export default function AppAlert({
  severity,
  title,
  hint,
  message,
  sx,
  ...rest
}: AppAlertProps) {
  const t = SEVERITY[severity];

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
          boxShadow: t.ring,
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
      <Typography
        variant="body2"
        sx={{ color: 'text.primary', lineHeight: 1.5 }}
      >
        {message}
      </Typography>
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
