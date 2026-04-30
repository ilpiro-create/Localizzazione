const CACHE = 'tracker-soste-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Installazione: pre-cacha le risorse principali
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Attivazione: rimuovi cache vecchie
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first, fallback cache
self.addEventListener('fetch', e => {
  // Non intercettare richieste a domini esterni (tile map, geocoding, CDN)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Ricezione notifiche push
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: '📍 Tracker Soste', body: 'Apri l\'app' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'tracker-reminder',
      renotify: true,
      requireInteraction: false
    })
  );
});

// Click sulla notifica → apri l'app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('index.html') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});
