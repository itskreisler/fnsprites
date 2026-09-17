/**
 * @file sw.js
 * @description Service Worker providing offline support, PWA asset caching, and automatic cache invalidation for new sprites/codes.
 */

// Bump version when adding new sprites, codes, or assets
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `fn-sprites-${CACHE_VERSION}`;

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

// Install Event: Cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Immediately purge old cache versions when CACHE_VERSION changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('fn-sprites-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate strategy for static assets & network-first for new sprites
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // For sprite PNG image requests: Network-First with Cache Fallback to ensure newly added sprite images load immediately
  if (url.pathname.includes('/sprites/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-while-revalidate for core app files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
          return networkResponse;
        })
        .catch(() => {/* Offline fallback */});

      return cachedResponse || fetchPromise;
    })
  );
});
