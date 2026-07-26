'use client';

import { getEcho, isReverbRealtimeConfigured } from '@/lib/chat/echo';
import { paymentKeys } from '@/lib/query-keys';
import { useAuth } from '@/providers/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface CreditsUpdatedEvent {
  balance?: number;
}

/**
 * Écoute le canal privé `user.{id}` et met à jour le solde de crédits +
 * l'historique des transactions EN TEMPS RÉEL dès qu'un `credits.updated`
 * arrive (achat crédité côté serveur via webhook, dépense de crédits,
 * remboursement) — sans polling. Composant sans rendu, monté une fois
 * dans le layout. No-op sans Reverb ou sans utilisateur connecté.
 */
export function CreditsRealtimeListener() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isReverbRealtimeConfigured()) {
      return;
    }

    const channelName = `user.${user.id}`;
    const echo = getEcho();
    const channel = echo.private(channelName);

    const handler = (event: CreditsUpdatedEvent): void => {
      if (typeof event.balance === 'number') {
        // Le solde est un nombre dans le cache (['credits-balance']).
        queryClient.setQueryData<number>(['credits-balance'], event.balance);
      }
      // La transaction diffusée n'a pas la même forme que l'historique des
      // paiements — on invalide pour un refetch propre.
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    };

    channel.listen('.credits.updated', handler);

    return () => {
      channel.stopListening('.credits.updated', handler);
    };
  }, [isAuthenticated, user?.id, queryClient]);

  return null;
}
