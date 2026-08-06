'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState } from 'react';
import { AxiosError } from 'axios';

import {
  CHAT_CACHE_BUSTER,
  createChatCachePersister,
  shouldPersistQuery,
} from '@/lib/query-persister';

/**
 * QueryClient unique + persistance chiffrée du cache chat (modèle
 * WhatsApp Web) : inbox, fils et compteur non-lu sont restaurés
 * INSTANTANÉMENT au chargement depuis le snapshot local chiffré, puis
 * resynchronisés en arrière-plan (stale-while-revalidate). La restauration
 * est asynchrone et postérieure au premier rendu → aucun mismatch
 * d'hydratation. Seules les racines chat sont persistées (voir
 * `src/lib/query-persister.ts`) ; le snapshot est purgé au logout.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error) => {
              // Never retry on 401 (auth) or 403 (forbidden) — these aren't transient
              if (
                error instanceof AxiosError &&
                (error.response?.status === 401 ||
                  error.response?.status === 403)
              ) {
                return false;
              }
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Closures pures — aucun accès window avant l'appel effectif (client).
  const [persister] = useState(() => createChatCachePersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        buster: CHAT_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            shouldPersistQuery(query.queryKey),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
