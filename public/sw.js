/**
 * KeyHome PWA Service Worker
 *
 * Strategies:
 * - Cache-first for static assets (images, fonts, CSS, JS)
 * - Network-first for pages (HTML navigation)
 * - Stale-while-revalidate for API GET requests
 * - Offline fallback page when network is unavailable
 */

const CACHE_VERSION = 'keyhome-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/home',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/logo.png',
];

const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(woff2?|ttf|otf|eot)(\?.*)?$/,
  /\.(png|jpg|jpeg|gif|svg|webp|ico)(\?.*)?$/,
  /\/icons\//,
];

const NO_CACHE_PATTERNS = [
  /\/api\//,
  /clerk/,
  /\/_next\/data\//,
  /\/login/,
  /\/register/,
  /\/__nextjs/,
  /hot-update/,
  /sentry/,
];

// ── Install ─────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('keyhome-') && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip no-cache patterns
  if (NO_CACHE_PATTERNS.some((re) => re.test(url.pathname + url.search))) {
    return;
  }

  // Static assets → cache-first
  if (STATIC_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests → network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // Everything else → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Strategies ──────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Serve the offline page
    const offlineCached = await caches.match(OFFLINE_URL);
    if (offlineCached) {
      return offlineCached;
    }
    return new Response(
      '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;background:#0A0A0F;color:#fff"><div style="text-align:center"><h1>Hors ligne</h1><p>Vérifiez votre connexion internet.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ── Push notifications placeholder ──────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'KeyHome';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
