'use client';

import { SnackbarProvider } from 'notistack';
import type { ReactNode } from 'react';

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Global toast/snackbar provider using notistack.
 * Provides success, error, warning, info variants with auto-hide.
 */
export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      preventDuplicate
      style={{ fontFamily: 'inherit' }}
      Components={
        {
          // Custom styles handled via sx below
        }
      }
    >
      {children}
    </SnackbarProvider>
  );
}
