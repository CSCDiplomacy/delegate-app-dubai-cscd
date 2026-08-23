/* CSCD Delegate App — service worker (v3, React shell).
   v1 (vanilla app) precached /js/app.js, /css/app.css etc. cache-first; those
   files no longer exist, so each version bump's first job is to wipe old
   caches. Strategy:
   - Navigations: network-first (fresh index.html on every deploy), cache fallback.
   - /assets/* (Vite content-hashed): cache-first — a hash change is a new URL.
   - /img/* + static event JSON (/api/rundown etc.): network-first, cache is
     only an offline fallback. These filenames/URLs DON'T change when the
     content behind them does (banners get swapped, rundown/visits/hotels
     JSON gets edited in place), so serving cache-first or stale-while-
     revalidate here means real edits don't show up promptly during active
     content iteration. Bump CACHE (v2 -> v3 etc.) whenever a deployed change
     needs to force-purge what's already cached on returning visitors' devices.
   - Everything else (auth, per-user API, cross-origin): network only. */

const CACHE = 'cscd-v3';
const STATIC_API = ['/api/rundown', '/api/visits', '/api/speakers', '/api/checkin', '/api/contact'];

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Navigations: network-first so deploys reach users immediately.
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put('/index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Hashed build assets: cache-first — a content change is a new URL, so a
  // cached copy is never stale by definition.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // Images + static event JSON: network-first. Same URL can point at edited
  // content (a swapped banner, an updated rundown), so prefer live network
  // and only fall back to the cache when offline.
  if (url.pathname.startsWith('/img/') || STATIC_API.some((p) => url.pathname.startsWith(p))) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((cache) => cache.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  // Everything else falls through to the network.
});
