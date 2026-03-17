// KeyHome Push Notification Service Worker
// Handles incoming push events and notification clicks for the Next.js frontend.

self.addEventListener("push", (event) => {
  let data = {
    title: "KeyHome",
    body: "Vous avez une nouvelle notification.",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
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

  const targetPath = event.notification.data?.url || "/home";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            return client.focus().then((focused) => {
              if ("navigate" in focused) {
                return focused.navigate(targetUrl);
              }
              return focused;
            });
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
