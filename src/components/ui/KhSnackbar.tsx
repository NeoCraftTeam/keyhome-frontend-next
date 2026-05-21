'use client';

import { Alert, Snackbar } from '@mui/material';

interface KhSnackbarProps {
  open: boolean;
  message: string | null;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function KhSnackbar({
  open,
  message,
  severity,
  onClose,
  duration = 3000,
}: KhSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        role="status"
        aria-live={severity === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        sx={{
          borderRadius: '12px',
          maxWidth: 360,
          fontSize: '0.875rem',
          fontWeight: 500,
          letterSpacing: 0,
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          ...(severity === 'success' && {
            bgcolor: '#0D9488',
            color: '#fff',
            '& .MuiAlert-icon': { color: 'rgba(255,255,255,0.85)' },
            '& .MuiAlert-action': { color: 'rgba(255,255,255,0.7)' },
          }),
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
