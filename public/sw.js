// VARPL Service Worker
// Only caches static assets (icons, manifest) for installability.
// ALL page navigations and API calls always go directly to the network —
// this prevents stale cache from breaking login, auth redirects, and dynamic pages.

const CACHE_NAME = 'varpl-static-v1';

const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: pre-cache only static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: ONLY serve from cache for static assets.
// Pages, API routes, and everything else always go to the network.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept GET requests for known static assets
  const isStaticAsset =
    event.request.method === 'GET' &&
    (STATIC_ASSETS.includes(url.pathname) ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/logo.png');

  if (isStaticAsset) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
  // Everything else (pages, Next.js chunks, API calls) — no interception
});
