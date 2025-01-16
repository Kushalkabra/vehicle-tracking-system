/// <reference lib="webworker" />

const CACHE_NAME = 'fleettracker-v1';
const OFFLINE_URL = '/offline.html';

const CACHE_VERSIONS = {
  STATIC: 'static-v1',
  DYNAMIC: 'dynamic-v1',
  API: 'api-v1'
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

const API_ROUTES = [
  '/api/location',
  '/api/push/subscribe'
];

declare const self: ServiceWorkerGlobalScope;

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager;
}

declare global {
  interface ServiceWorkerGlobalScope {
    onperiodicsync: ((event: PeriodicSyncEvent) => void) | null;
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(async (key) => {
          if (key !== CACHE_NAME) {
            await caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // API calls - Network first
  if (API_ROUTES.some(route => request.url.includes(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache first
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML navigation - Network first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirst(request));
});

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'locationUpdate') {
    console.log('[ServiceWorker] Background sync triggered:', event.tag);
    event.waitUntil(syncLocationUpdates());
  }
});

async function syncLocationUpdates() {
  const db = await openDB();
  const updates = await db.getAll('locationUpdates');
  
  console.log('[ServiceWorker] Processing background updates:', updates.length);
  
  if (updates.length === 0) return;

  try {
    const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    for (const update of updates) {
      console.log('[ServiceWorker] Sending background update:', update);
      ws.send(JSON.stringify({
        type: 'driverLocationUpdate',
        payload: update
      }));
      await db.delete('locationUpdates', update.id);
    }

    console.log('[ServiceWorker] Background sync completed successfully');
    ws.close();
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
    throw error; // This will cause the sync to retry
  }
}

// IndexedDB helper functions
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('FleetTracker', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('locationUpdates')) {
        db.createObjectStore('locationUpdates', { keyPath: 'id' });
      }
    };
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...data
    },
    actions: [
      {
        action: 'open',
        title: 'Open app'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FleetTracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

async function cacheStaticAssets() {
  const cache = await caches.open(CACHE_VERSIONS.STATIC);
  await cache.addAll(STATIC_ASSETS);
}

async function networkFirst(request: Request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_VERSIONS.DYNAMIC);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline.html');
  }
}

async function cacheFirst(request: Request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_VERSIONS.STATIC);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match('/offline.html');
  }
}

// Add periodic sync registration
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationUpdates());
  }
});

// Add this event listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 