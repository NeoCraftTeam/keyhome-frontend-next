'use client';

import { useCallback } from 'react';

const SYNC_TAG = 'kh-sync-viewing-response';
const DB_NAME = 'kh-sync-db';
const DB_VER = 2;
const STORE = 'viewing-responses';

interface QueuedRequest {
  url: string;
  method: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/** Open the shared sync IndexedDB (same DB as sw.js — must stay in sync). */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

/** Queue a viewing confirm/decline to be replayed when connectivity returns. */
async function enqueueViewingResponse(record: QueuedRequest): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Hook to perform a viewing confirm/decline with automatic offline queueing.
 *
 * Usage:
 *   const { respondToViewing } = useViewingResponseSync();
 *   await respondToViewing('/api/v1/viewings/reservations/uuid/confirm', 'POST');
 */
export function useViewingResponseSync() {
  const respondToViewing = useCallback(
    async (
      url: string,
      method: 'POST' | 'PATCH' = 'POST',
      body?: Record<string, unknown>
    ): Promise<{ queued: boolean }> => {
      if (navigator.onLine) {
        return { queued: false };
      }

      await enqueueViewingResponse({ url, method, body });

      // Register the background sync tag if the API is available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        await (
          reg as ServiceWorkerRegistration & {
            sync: { register(tag: string): Promise<void> };
          }
        ).sync.register(SYNC_TAG);
      }

      return { queued: true };
    },
    []
  );

  return { respondToViewing };
}
