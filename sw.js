const CACHE_NAME = 'tea-diary-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install start');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cache opened:', CACHE_NAME);
      return Promise.all(
        PRECACHE_URLS.map(url => {
          return cache.add(url)
            .then(() => console.log('[SW] ✅ Закэшировано:', url))
            .catch(err => console.warn('[SW] ❌ Не удалось закэшировать:', url, err));
        })
      );
    })
    .then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
    .catch(err => {
      console.error('[SW] Install failed:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});