// DEPRECATED: KeyHome now uses a single service worker (/sw.js) that handles
// both caching AND Firebase Cloud Messaging push events. Two SWs at the same
// scope race for activation and the loser silently drops messages on standalone
// PWA installs.
//
// This file remains only to satisfy old browsers that already cached it as the
// FCM SW. It immediately unregisters itself so the active /sw.js takes over.

self.addEventListener('install', (event) => {
  // Skip waiting so the SW activates immediately.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        // Reload all clients so they re-register the canonical /sw.js.
        clients.forEach((client) => {
          if ('navigate' in client) client.navigate(client.url);
        });
      })
      .catch(() => {
        /* unregister can fail in edge cases — non-fatal */
      })
  );
});
