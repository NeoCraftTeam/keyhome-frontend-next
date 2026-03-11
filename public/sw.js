/**
 * KeyHome PWA Service Worker — v5
 *
 * Strategies:
 *   CacheFirst              → Next.js static chunks (immutable), fonts
 *   CacheFirst + eviction   → Images (LRU, 60 entries, 30-day max)
 *   NetworkFirst            → HTML navigation with offline fallback
 *   StaleWhileRevalidate    → Dynamic same-origin GETs
 *   Bypass                  → Auth (Clerk), analytics, mutations
 *
 * Extras: BackgroundSync stubs, Push/notificationclick, message channel
 */

const CACHE_VERSION = 'keyhome-v5';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;
const OFFLINE_URL   = '/offline';

const MAX_IMAGE_ENTRIES = 60;
const MAX_IMAGE_AGE_SEC = 30 * 24 * 60 * 60; // 30 days (informational)

// Assets to guarantee exist in the cache before the SW activates
const PRECACHE_ASSETS = [
  '/',
  '/home',
  '/offline',          // ← was missing in v4
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/logo.png',
];

// Next.js static output + web fonts → cache forever (content-hashed)
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(woff2?|ttf|otf|eot)(\?.*)?$/,
  /\/fonts\//,
];

// Images handled separately for LRU eviction
const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|webp|ico|avif)(\?.*)?$/,
  /\/icons\//,
  /\/images\//,
];

// Never intercept — Clerk SSO, analytics, dev tooling, Sentry
const BYPASS_PATTERNS = [
  /\/api\/auth\//,
  /clerk/,
  /\/__nextjs/,
  /hot-update/,
  /sentry/,
  /googletagmanager/,
  /mapbox\.com\/events/,
  /^\/_next\/image(\?|$)/,
];

// Background Sync queue tags
const SYNC = {
  FAVORITES: 'sync-favorites',
  ENQUIRIES: 'sync-enquiries',
};

// ── Install ─────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_ASSETS).catch((err) =>
          console.warn('[SW] Precache partial failure:', err)
        )
      )
  );
  // Take control immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate — evict all previous-version caches ─────────────────────
self.addEventListener('activate', (event) => {
  const valid = new Set([STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('keyhome-') && !valid.has(k))
            .map((k) => {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
        )
      )
  );
  // Claim all existing clients without a page reload
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip auth / analytics / dev patterns
  if (BYPASS_PATTERNS.some((re) => re.test(url.href))) return;

  // Immutable Next.js chunks & fonts → CacheFirst (no expiry needed)
  if (STATIC_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images → CacheFirst with LRU eviction
  if (IMAGE_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(cacheFirstEvict(request, IMAGE_CACHE));
    return;
  }

  // HTML navigation → NetworkFirst + offline fallback page
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(request));
    return;
  }

  // Remaining same-origin GETs → StaleWhileRevalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Strategy helpers ──────────────────────────────────────────────────

/** Cache-First: serve from cache, fetch and store on miss. */
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
    return new Response('', { status: 408, statusText: 'Asset unavailable offline' });
  }
}

/** Cache-First with FIFO eviction to cap image cache size. */
async function cacheFirstEvict(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_ENTRIES) {
        // Evict the oldest entry
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Image unavailable offline' });
  }
}

/** Network-First: try network, fall back to cache then offline page. */
async function networkFirstNavigate(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;

    // Ultimate inline fallback (only reached if /offline was not precached)
    return new Response(
      `<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Hors ligne — KeyHome</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{display:flex;align-items:center;justify-content:center;min-height:100vh;
          font-family:Inter,system-ui,sans-serif;background:#0A0A0F;color:#fff;padding:1rem}
        .card{text-align:center;max-width:340px}
        h1{font-size:3rem;margin-bottom:.5rem}
        h2{font-size:1.4rem;font-weight:700;margin-bottom:.75rem;color:#F6475F}
        p{color:#9CA3AF;line-height:1.6;margin-bottom:1.5rem}
        button{background:linear-gradient(135deg,#F6475F,#D93A50);color:#fff;border:none;
          padding:.75rem 1.75rem;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer}
        button:hover{opacity:.9}
      </style></head>
      <body><div class="card">
        <div h1>🏠</div>
        <h2>Vous êtes hors ligne</h2>
        <p>Vérifiez votre connexion internet et réessayez.</p>
        <button onclick="location.reload()">Réessayer</button>
      </div></body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/** Stale-While-Revalidate: serve from cache instantly, refresh in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const revalidate = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached || new Response('', { status: 503 }));

  return cached || revalidate;
}

// ── Push Notifications ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'KeyHome', body: event.data.text() };
  }

  const title = data.title || 'KeyHome';
  const options = {
    body:      data.body    || 'Nouvelle notification',
    icon:      data.icon    || '/icons/icon-192x192.png',
    badge:                     '/icons/icon-96x96.png',
    image:     data.image,
    vibrate:   [100, 50, 100],
    tag:       data.tag     || 'keyhome-notif',
    renotify:  true,
    data:      { url: data.url || '/home' },
    actions:   data.actions || [
      { action: 'open',    title: 'Ouvrir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/home';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const match = clients.find((c) => c.url.includes(targetUrl) && 'focus' in c);
        return match ? match.focus() : self.clients.openWindow(targetUrl);
      })
  );
});

// ── Background Sync ───────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC.FAVORITES) {
    event.waitUntil(flushSyncQueue('pending-favorites', '/api/favorites'));
  }
  if (event.tag === SYNC.ENQUIRIES) {
    event.waitUntil(flushSyncQueue('pending-enquiries', '/api/contact'));
  }
});

/**
 * Flush a named IndexedDB queue to an API endpoint.
 * Replace the IDB stubs with idb-keyval or your preferred wrapper.
 */
async function flushSyncQueue(storeName, endpoint) {
  console.log(`[SW] BackgroundSync: flushing "${storeName}" → ${endpoint}`);
  // TODO: implement with IndexedDB (e.g. idb-keyval):
  // const items = await idbGet(storeName) ?? [];
  // for (const item of items) {
  //   const res = await fetch(endpoint, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(item),
  //   });
  //   if (res.ok) await idbDelete(storeName, item.id);
  // }
}

// ── Message channel (page ↔ SW) ───────────────────────────────────────
self.addEventListener('message', (event) => {
  // Page can send { type: 'SKIP_WAITING' } to force SW activation
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Page can ask the active SW version
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION });
  }

  // Page can trigger a manual cache purge
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
