// Suruwe service worker — minimal, for PWA installability
// No aggressive caching. Suruwe pulls live data from Supabase,
// so we do not want stale cache issues.

const CACHE_NAME = 'suruwe-v1';

// Install: cache only the app shell essentials
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything.
// Only fall back to cache for navigation requests (the app shell).
// API calls and data always go to network.
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Supabase API calls and analytics — always network
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('vercel') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});
