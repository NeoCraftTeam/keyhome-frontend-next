'use client';

import { SignalWifiOff, Wifi } from '@mui/icons-material';
import { Alert, Slide, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * Shows a subtle toast when the user goes offline or comes back online.
 */
export default function NetworkStatus() {
  const [showOnline, setShowOnline] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    // Set initial offline state after mount (navigator is not available on server)
    if (!navigator.onLine) {
      setShowOffline(true);
    }

    const goOnline = () => {
      setShowOffline(false);
      setShowOnline(true);
    };

    const goOffline = () => {
      setShowOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <>
      <Snackbar
        open={showOffline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity="warning"
          icon={<SignalWifiOff sx={{ fontSize: 20 }} />}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          Connexion perdue — mode hors ligne
        </Alert>
      </Snackbar>

      <Snackbar
        open={showOnline}
        autoHideDuration={3000}
        onClose={() => setShowOnline(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert
          severity="success"
          icon={<Wifi sx={{ fontSize: 20 }} />}
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          Connexion rétablie
        </Alert>
      </Snackbar>
    </>
  );
}
