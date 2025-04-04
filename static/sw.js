// OmGame ServiceWorker - Sayfa Hızlandırma v1.0
const CACHE_NAME = 'omgame-cache-v1';
const RESOURCES_TO_CACHE = [
  '/',
  '/static/css/style.css',
  '/static/css/auth.css',
  '/static/css/games.css',
  '/static/css/game-components.css',
  '/static/css/leaderboard.css',
  '/static/css/navbar-fixes.css',
  '/static/css/profile_new.css',
  '/static/js/UIKit.js',
  '/static/js/main.js',
  '/static/images/logo.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
];

// ServiceWorker kurulumu
self.addEventListener('install', (event) => {
  // Önbelleğe alınacak kaynaklar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// ServiceWorker aktivasyonu
self.addEventListener('activate', (event) => {
  // Eski önbellekleri temizle
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Network isteklerini yönet
self.addEventListener('fetch', (event) => {
  // Statik kaynaklar için önbellek-önce stratejisi
  if (event.request.url.includes('/static/') || 
      event.request.url.includes('bootstrap') || 
      event.request.url.includes('font-awesome') ||
      event.request.url.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Önbellekte varsa kullan
          if (response) {
            return response;
          }
          
          // Önbellekte yoksa ağdan al ve önbelleğe ekle
          return fetch(event.request)
            .then((networkResponse) => {
              // Sadece başarılı yanıtları önbelleğe ekle
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              // Önbelleğe ekle (clone kullan çünkü stream sadece bir kez okunabilir)
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return networkResponse;
            });
        })
    );
  } else {
    // Dinamik içerik için ağ-önce stratejisi
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Ağa erişim yoksa, önbellekteki versiyonu dene
          return caches.match(event.request);
        })
    );
  }
});
