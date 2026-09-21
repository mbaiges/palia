const CACHE_NAME = 'palia-cache-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/logo_icon.png',
  '/logo_icon_192.png',
  '/logo_icon_48.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const html = await fetch('/index.html').then((response) => response.text());
      const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([...new Set([...ASSETS, ...builtAssets])]);
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (new URL(e.request.url).pathname.startsWith('/api/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => response)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(new URL(e.request.url).pathname, { ignoreSearch: true });
    if (cachedResponse) return cachedResponse;
    return fetch(e.request);
  })());
});

// Push Notifications Listener
self.addEventListener('push', (e) => {
  let payload = {};
  try { payload = e.data?.json() ?? {}; } catch { payload = {}; }
  const options = {
    body: 'Hay una actualización. Inicia sesión para consultar la información.',
    icon: '/logo_icon_192.png',
    badge: '/logo_icon_192.png',
    vibrate: [100, 50, 100],
    data: { notificationId: payload.data?.notificationId, alertId: payload.data?.alertId }
  };

  e.waitUntil(
    self.registration.showNotification('Palia', options)
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alertId = e.notification.data?.alertId;
  const destination = alertId ? `/?alertId=${encodeURIComponent(alertId)}` : '/';
  e.waitUntil(
    clients.openWindow(destination)
  );
});
