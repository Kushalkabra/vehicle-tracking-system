const CACHE_NAME = 'vehicle-tracker-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Network error' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'location-update') {
    event.waitUntil(
      self.registration.showNotification('Vehicle Tracker', {
        body: 'Background tracking active',
        icon: '/icon.png',
        tag: 'location-tracking',
        silent: true
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-update') {
    event.waitUntil(
      self.registration.showNotification('Vehicle Tracker', {
        body: 'Location tracking is running in background',
        icon: '/icon.png',
        tag: 'location-tracking',
        silent: true
      })
    );
  }
}); 