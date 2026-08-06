'use client';

import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

import { decryptFromCache, encryptForCache } from '@/lib/query-cache-crypto';

/**
 * Persister du cache chat (modèle WhatsApp Web) : snapshots TanStack
 * Query chiffrés (AES-GCM, clé non-extractible en IndexedDB) dans
 * localStorage, écriture throttlée à 1 s. Limité aux racines du chat —
 * inbox, fils, compteur non-lu — pour un affichage INSTANTANÉ au
 * chargement de la page, puis resync en arrière-plan.
 */

export const CHAT_CACHE_STORAGE_KEY = 'kh-chat-cache-v1';
export const CHAT_CACHE_BUSTER = 'kh-web-chat-v1';

/** Racines de queryKey persistées — chat uniquement. */
const PERSISTED_ROOTS = new Set([
  'conversations',
  'chat-messages',
  'chat-unread',
]);

/**
 * Verrou de purge (logout) : une fois activé, toute écriture ultérieure
 * est ignorée. Sans lui, une mutation du cache dans la fenêtre de
 * throttle (1 s) entre le wipe des storages et la navigation dure
 * réécrirait le snapshot chiffré — résurrection du chat d'un compte
 * sur un poste partagé. L'état module repart à zéro au rechargement
 * complet qui suit le logout.
 */
let cachePurged = false;

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const root = queryKey[0];
  return typeof root === 'string' && PERSISTED_ROOTS.has(root);
}

export function createChatCachePersister(): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    timer = null;
    const toWrite = pending;
    pending = null;
    if (!toWrite || cachePurged) return;
    void (async () => {
      try {
        const cipher = await encryptForCache(JSON.stringify(toWrite));
        window.localStorage.setItem(CHAT_CACHE_STORAGE_KEY, cipher);
      } catch {
        /* quota / crypto indisponible — best effort, jamais bloquant */
      }
    })();
  };

  return {
    persistClient: (client) => {
      if (cachePurged) {
        return Promise.resolve();
      }
      pending = client;
      if (!timer) {
        timer = setTimeout(flush, 1000);
      }
      return Promise.resolve();
    },

    restoreClient: async () => {
      try {
        const raw = window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY);
        if (!raw) return undefined;
        return JSON.parse(await decryptFromCache(raw)) as PersistedClient;
      } catch {
        // Snapshot corrompu ou clé régénérée (profil navigateur nettoyé)
        // → purge et démarrage propre, l'API refera foi.
        window.localStorage.removeItem(CHAT_CACHE_STORAGE_KEY);
        return undefined;
      }
    },

    removeClient: async () => {
      window.localStorage.removeItem(CHAT_CACHE_STORAGE_KEY);
    },
  };
}

/**
 * Supprime le snapshot chat persisté. Appelé au logout : les messages
 * du compte précédent ne doivent ni se réafficher pour le compte
 * suivant, ni rester lisibles sur un poste partagé. Verrouille aussi
 * toute réécriture jusqu'au rechargement de la page (voir ci-dessus).
 */
export function clearChatCacheSnapshot(): void {
  cachePurged = true;
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CHAT_CACHE_STORAGE_KEY);
}
