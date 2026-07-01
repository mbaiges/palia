const CACHE_NAME = 'palia-cache-v3';
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
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
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
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => response)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => undefined);
    })
  );
});

// Push Notifications Listener
self.addEventListener('push', (e) => {
  let data = { title: 'Palia', body: 'Alerta clínica registrada por un voluntario.' };
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      data = { title: 'Palia', body: e.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo_icon_192.png',
    badge: '/logo_icon_192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow('/')
  );
});
