'use client';

import { Alert, Snackbar, type SnackbarOrigin } from '@mui/material';
import type { ReactNode } from 'react';
import { radius, semantic, shadow } from '@/theme/tokens';

export type KhSnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface KhSnackbarFill {
  /** Solid background of the filled toast. */
  bg: string;
  /** Foreground (text + icon) colour, chosen for contrast on `bg`. */
  fg: string;
}

/**
 * Resolve the filled-toast colours from the brand semantic tokens.
 *
 * Pure + exported for unit tests. Filled toasts are solid (mode-independent),
 * so one map serves light and dark. Success uses the brand green
 * (`semantic.success`) — the previous hardcoded `#0D9488` teal was the
 * owner/agent brand leaking into every toast.
 */
export function resolveSnackbarFill(
  severity: KhSnackbarSeverity
): KhSnackbarFill {
  return {
    success: { bg: semantic.success, fg: '#FFFFFF' },
    error: { bg: semantic.error, fg: '#FFFFFF' },
    info: { bg: semantic.info, fg: '#FFFFFF' },
    // Amber needs dark text for AA contrast.
    warning: { bg: semantic.warning, fg: '#1A1A1A' },
  }[severity];
}

interface KhSnackbarProps {
  open: boolean;
  message: string | null;
  severity: KhSnackbarSeverity;
  onClose: () => void;
  duration?: number;
  anchorOrigin?: SnackbarOrigin;
  action?: ReactNode;
}

export default function KhSnackbar({
  open,
  message,
  severity,
  onClose,
  duration = 3000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  action,
}: KhSnackbarProps) {
  const fill = resolveSnackbarFill(severity);

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        role="status"
        aria-live={severity === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        action={action}
        sx={{
          borderRadius: `${radius.md}px`,
          maxWidth: 360,
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: 0,
          boxShadow: shadow.modal,
          bgcolor: fill.bg,
          color: fill.fg,
          '& .MuiAlert-icon': { color: fill.fg, opacity: 0.9 },
          '& .MuiAlert-action': { color: fill.fg, opacity: 0.8 },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
