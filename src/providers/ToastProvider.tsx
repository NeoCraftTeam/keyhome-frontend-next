'use client';

import { SnackbarProvider } from 'notistack';
import type { ReactNode } from 'react';
import ChatToast from '@/components/chat/ChatToast';

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Global toast/snackbar provider using notistack.
 * Provides success, error, warning, info variants with auto-hide.
 *
 * Custom variants:
 * - `chatMessage` — branded chat notification (accentColor prop required).
 *   Used by ChatNotificationListener to colour-match the active panel
 *   (pink #F6475F for client, teal #0D9488 for owner).
 */
export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={4000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      preventDuplicate
      style={{ fontFamily: 'inherit' }}
      Components={{
        chatMessage: ChatToast,
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
