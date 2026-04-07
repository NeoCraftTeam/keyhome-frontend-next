// KeyHome Service Worker v3
// Push + Background Sync + Caching strategy for full offline/PWA support.

const VERSION      = "v3";
const STATIC_CACHE = `kh-static-${VERSION}`;
const API_CACHE    = `kh-api-${VERSION}`;
const NAV_CACHE    = `kh-nav-${VERSION}`;
const KNOWN_CACHES = [STATIC_CACHE, API_CACHE, NAV_CACHE];

// Shell assets pre-cached at install time (must exist in /public)
const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/manifest-owner.json",
  "/images/logo-teal.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ─── Install ────────────────────────────────────────────────────────────────
// Pre-cache shell assets. Do NOT auto-skipWaiting — the update toast in
// PWAInstallPrompt sends SKIP_WAITING when the user explicitly consents.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
// Remove stale caches from previous SW versions, then claim all clients.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Message — SKIP_WAITING ─────────────────────────────────────────────────
// PWAInstallPrompt posts { type: 'SKIP_WAITING' } before reload so the
// waiting SW takes over immediately, triggering controllerchange → reload.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Caching helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? Response.error();
  }
}

async function navigationWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(NAV_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match("/offline");
    return offlinePage ?? new Response("Hors ligne", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

// Owner-panel read-only API paths worth caching for offline resilience
const CACHEABLE_OWNER_PATHS = [
  "/api/v1/my/ads",
  "/api/v1/owner/analytics",
  "/api/v1/viewings/reservations",
  "/api/v1/notifications",
  "/api/v1/ads",
];

function isCacheableApi(pathname) {
  return CACHEABLE_OWNER_PATHS.some((p) => pathname.startsWith(p));
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept HTTP/HTTPS GET requests
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // 1. Cacheable read-only API calls → network-first (serve stale when offline).
  // Checked BEFORE the same-origin guard so cross-origin backend deployments
  // (e.g. api.keyhome.app serving keyhome.app) are also cached correctly.
  if (isCacheableApi(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Remaining strategies only apply to same-origin resources
  if (url.origin !== self.location.origin) return;

  // 2. Immutable Next.js build output + static assets → cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3. Navigation requests → network-first with /offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationWithOfflineFallback(request));
    return;
  }
});

// ─── Push Notifications ─────────────────────────────────────────────────────
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

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // If the push payload specifies a URL use it; otherwise detect panel context.
      let rawPath = event.notification.data?.url;
      if (!rawPath) {
        const isOwnerContext = allClients.some(
          (c) => c.url.startsWith(self.location.origin) && c.url.includes("/owner/")
        );
        rawPath = isOwnerContext ? "/owner/dashboard" : "/home";
      }
      const targetUrl = new URL(rawPath, self.location.origin).href;

      for (const client of allClients) {
        if (!client.url.startsWith(self.location.origin)) continue;
        await client.focus();
        // navigate() est supporté sur Chromium ; Safari / Firefox : on ouvre l'URL.
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

const SYNC_TAG_VIEWING_RESPONSE  = 'kh-sync-viewing-response';
// NOTE: kh-sync-favorites and kh-sync-contacts are intentionally NOT declared here.
// FavoritesProvider uses localStorage + fire-and-forget API calls (no offline queue).
// If offline favorites sync is needed in the future, add enqueue logic in FavoritesProvider
// and add the sync tag + handler here.

/** Open (or create) the offline-queue store. */
async function openSyncStore() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kh-sync-db', 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Keep all 3 stores for schema compatibility with existing installs.
      // Only 'viewing-responses' is actively used; others are forward-reserved.
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('contacts')) {
        db.createObjectStore('contacts', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('viewing-responses')) {
        db.createObjectStore('viewing-responses', { autoIncrement: true });
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
  // Owner: replay viewing confirm/decline actions queued while offline
  if (event.tag === SYNC_TAG_VIEWING_RESPONSE) {
    event.waitUntil(
      openSyncStore().then((db) =>
        drainStore(db, 'viewing-responses', async (record) => {
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
