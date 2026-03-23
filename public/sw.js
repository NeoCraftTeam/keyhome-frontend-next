// KeyHome Push Notification Service Worker
// Handles incoming push events and notification clicks for the Next.js frontend.

self.addEventListener("push", (event) => {
  let data = {
    title: "KeyHome",
    body: "Vous avez une nouvelle notification.",
    icon: "/images/logo-teal.png",
    badge: "/images/logo-teal.png",
    tag: "keyhome-notification",
    data: { url: "/home" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: data.actions || [],
      data: data.data || {},
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawPath = event.notification.data?.url || "/home";
  const targetUrl = new URL(rawPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if (!client.url.startsWith(self.location.origin)) {
          continue;
        }
        await client.focus();
        // navigate() est supporté sur Chromium ; Safari / Firefox : on ouvre l’URL.
        if ("navigate" in client && typeof client.navigate === "function") {
          try {
            return await client.navigate(targetUrl);
          } catch {
            /* fall through */
          }
        }
        return self.clients.openWindow(targetUrl);
      }

      return self.clients.openWindow(targetUrl);
    })(),
  );
});

// ─── Background Sync ─────────────────────────────────────────────────────────
// When the user performs an action while offline (e.g. adding a favourite),
// the page queues it in IndexedDB under a well-known sync tag. Once
// connectivity is restored the browser fires the 'sync' event here and we
// replay those queued requests against the API.

const SYNC_TAG_FAVORITES = 'kh-sync-favorites';
const SYNC_TAG_CONTACTS  = 'kh-sync-contacts';

/** Open (or create) the offline-queue store. */
async function openSyncStore(storeName) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kh-sync-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror  = (e) => reject(e.target.error);
  });
}

/** Drain all queued records from a store, calling fn(record) for each. */
async function drainStore(db, storeName, fn) {
  const tx    = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const keys   = await new Promise((res, rej) => {
    const r = store.getAllKeys();
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
  const values = await new Promise((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
  for (let i = 0; i < values.length; i++) {
    try {
      await fn(values[i]);
      store.delete(keys[i]);
    } catch {
      // Leave the record in the store for the next sync attempt.
    }
  }
  await new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG_FAVORITES) {
    event.waitUntil(
      openSyncStore('favorites').then((db) =>
        drainStore(db, 'favorites', async (record) => {
          await fetch(record.url, {
            method:  record.method || 'POST',
            headers: { 'Content-Type': 'application/json', ...record.headers },
            body:    record.body ? JSON.stringify(record.body) : undefined,
            credentials: 'include',
          });
        }),
      ),
    );
  }

  if (event.tag === SYNC_TAG_CONTACTS) {
    event.waitUntil(
      openSyncStore('contacts').then((db) =>
        drainStore(db, 'contacts', async (record) => {
          await fetch(record.url, {
            method:  record.method || 'POST',
            headers: { 'Content-Type': 'application/json', ...record.headers },
            body:    record.body ? JSON.stringify(record.body) : undefined,
            credentials: 'include',
          });
        }),
      ),
    );
  }
});
