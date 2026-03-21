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
