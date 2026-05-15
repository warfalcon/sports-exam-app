const CACHE_NAME = 'sports-exam-app-v2';
const CACHE_STATIC = 'sports-exam-static-v2';
const CACHE_DATA = 'sports-exam-data-v2';

const staticUrls = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/standards.js',
  '/manifest.json',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(staticUrls))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('Cache install failed:', error))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, CACHE_STATIC, CACHE_DATA].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            const fetchPromise = fetch(request)
              .then((networkResponse) => {
                caches.open(CACHE_STATIC).then((cache) => {
                  cache.put(request, networkResponse.clone());
                });
                return networkResponse;
              })
              .catch(() => cachedResponse);
            return cachedResponse || fetchPromise;
          }
          
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_STATIC).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
              return response;
            })
            .catch(() => {
              return caches.match('/index.html');
            });
        })
    );
  } else {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ offline: true, message: '当前处于离线状态，数据将在联网后同步' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    event.waitUntil(syncRecords());
  }
});

async function syncRecords() {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUEST' });
  });
}
