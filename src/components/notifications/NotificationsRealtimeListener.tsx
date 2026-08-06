'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/chat/echo';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

interface SearchAlertMatchEvent {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  ad_id?: string;
  ad_title?: string;
  ad_slug?: string;
  alert_id?: string;
}

/**
 * Écoute l'event `search_alert.match` sur le canal privé `user.{id}`
 * (diffusé par {@see SearchAlertMatchNotification} via son channel
 * `broadcast` Laravel) :
 *
 *  1. invalide le centre de notifications (badge + liste) — temps réel,
 *     sans attendre le prochain polling ;
 *  2. affiche un toast « Voir » qui ouvre directement la fiche annonce.
 *
 * Composant sans rendu, monté une fois dans les layouts authentifiés.
 * No-op sans Reverb ou sans utilisateur connecté.
 */
export function NotificationsRealtimeListener() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isReverbRealtimeConfigured()) {
      return;
    }

    const echo = getEcho();
    const channel = echo.private(`user.${user.id}`);

    const handler = (raw: unknown) => {
      const event = raw as SearchAlertMatchEvent;

      // Centre de notifications : liste + badge non-lu (préfixe commun).
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const slug = event.ad_slug ?? event.ad_id;
      const message =
        event.message ??
        (event.ad_title
          ? `${event.ad_title} correspond à votre alerte`
          : 'Une annonce correspond à votre alerte');

      enqueueSnackbar(message, {
        variant: 'info',
        autoHideDuration: 7000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
        action: (key) => (
          <>
            {slug ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  closeSnackbar(key);
                  router.push(`/ads/${encodeURIComponent(slug)}`);
                }}
              >
                Voir
              </Button>
            ) : null}
            <Button
              color="inherit"
              size="small"
              onClick={() => closeSnackbar(key)}
            >
              Fermer
            </Button>
          </>
        ),
      });
    };

    channel.listen('.search_alert.match', handler);

    return () => {
      // stopListening (et non leave) : le canal `user.{id}` est partagé
      // avec les autres listeners (crédits, chat).
      channel.stopListening('.search_alert.match', handler);
    };
  }, [
    isAuthenticated,
    user?.id,
    queryClient,
    enqueueSnackbar,
    closeSnackbar,
    router,
  ]);

  return null;
}
