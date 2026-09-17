const CACHE_NAME = 'fn-sprites-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './codes.html',
  './styles.css',
  './app.js',
  './codes-app.js',
  './sprites-data.js',
  './codes-data.js',
  './manifest.json',
  './favicon.ico',
  './sitemap.xml',
  './robots.txt',
  './src/constants.js',
  './src/klei.js',
  './src/klei-codes.js',
  './src/export/canvasExport.js',
  './src/export/tradeText.js',
  './src/ui/commonUi.js',
  './src/utils/clipboard.js',
  './src/utils/encoder.js',
  './src/utils/helpers.js',
  './src/utils/storage.js',
  './src/utils/toast.js',
  './src/i18n/langs/es.js',
  './src/i18n/langs/en.js',
  './src/i18n/langs/de.js'
];

// Install Event: Pre-cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First for static assets, Network-First for dynamic/external requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore cross-origin non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response, update cache in background (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline fallback, suppress network errors */});

        return cachedResponse;
      }

      // If not in cache, fetch from network and store in cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));

        return networkResponse;
      }).catch(() => {
        // Handle offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
