const CACHE_NAME = 'liuyao-v3';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/gua-display.css',
  './css/report.css',
  './js/app-bundle.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API 请求不缓存，直接走网络
  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  const isDocument = e.request.mode === 'navigate' || e.request.destination === 'document';

  // HTML文档优先网络，确保线上及时拿到最新版本
  if (isDocument) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：缓存优先 + 后台刷新
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return resp;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
