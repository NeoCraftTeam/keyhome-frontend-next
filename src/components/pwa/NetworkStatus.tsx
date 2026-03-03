'use client';

import { useEffect, useState } from 'react';
import { Alert, Slide, Snackbar } from '@mui/material';
import { SignalWifiOff, Wifi } from '@mui/icons-material';

/**
 * Shows a subtle toast when the user goes offline or comes back online.
 */
export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const goOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
      setShowOnline(true);
    };

    const goOffline = () => {
      setIsOnline(false);
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
        open={showOnline && !isOnline === false}
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
