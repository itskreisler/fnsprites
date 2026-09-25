/**
 * @file sw.js
 * @description Service Worker providing offline support, PWA asset caching, and automatic cache invalidation for new sprites/codes.
 */

// Bump version on EVERY deploy (nuevo sprite, código, bugfix, UI...) para
// invalidar el caché y que los cambios se vean al instante.
const CACHE_VERSION = 'v1.0.7';
const CACHE_NAME = `fn-sprites-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './codes.html',
  './privacy.html',
  './terms.html',
  './styles.css',
  './app.js',
  './codes-app.js',
  './sprites-data.js',
  './codes-data.js',
  './manifest.json',
  './sitemap.xml',
  './robots.txt',
  './src/constants.js',
  './src/klei.js',
  './src/klei-codes.js',
  './src/legal.js',
  './src/export/canvasExport.js',
  './src/export/tradeText.js',
  './src/ui/commonUi.js',
  './src/ui/changelog.js',
  './src/utils/clipboard.js',
  './src/utils/encoder.js',
  './src/utils/helpers.js',
  './src/utils/storage.js',
  './src/utils/toast.js',
  './src/utils/crypto.js',
  './src/utils/securedStorage.js',
  './src/sync/config.js',
  './src/sync/drive.js',
  './src/sync/syncController.js',
  './src/i18n/index.js',
  './src/i18n/dom.js',
  './src/i18n/langs/es.js',
  './src/i18n/langs/en.js',
  './src/i18n/langs/de.js',
  './siteimages/logo.png',
  './siteimages/logo-192.png',
  './siteimages/google.svg'
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

  // Network-first para navegación (HTML): los cambios se ven al instante,
  // con fallback a caché si no hay conexión (offline).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then((res) => res || caches.match('./'))
        )
    );
    return;
  }

  // Stale-while-revalidate for core app files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => {/* Offline fallback */});

      return cachedResponse || fetchPromise;
    })
  );
});
