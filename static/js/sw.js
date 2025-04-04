/**
 * ZekaPark Service Worker
 * Sayfa Yükleme Hızı Optimizasyonu
 * Önbellek ve Ağ Performansı
 */

const CACHE_VERSION = 'v2'; // Sürüm değiştiğinde, tüm önbellek yenilenir
const CACHE_NAME = `zekapark-${CACHE_VERSION}`;

// Önbelleğe alınacak temel kaynaklar
const PRECACHE_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/css/auth.css',
  '/static/css/games.css',
  '/static/css/game-components.css',
  '/static/css/defer.css',
  '/static/css/prefetch.css',
  '/static/js/main.js',
  '/static/js/turbo-loader.js',
  '/static/js/performance.js',
  '/static/images/logo.png'
];

// Görseller gibi ikincil önbelleğe alınacak kaynaklar
const SECONDARY_CACHE_ASSETS = [
  '/static/images/',
  '/static/js/'
];

// Sadece önbellekten sunulabilecek varlık uzantıları
const CACHEABLE_EXTENSIONS = [
  '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'
];

// Install event - yeni önbellek oluştur ve önceden belirlenmiş kaynakları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Önbellek oluşturuldu ve temel kaynaklar önbelleğe alındı');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Yeni service worker'ı hemen etkinleştir
  );
});

// Activate event - eski önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('zekapark-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Eski önbellek siliniyor:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Yeni service worker'ın kontrolünü hemen al
      return self.clients.claim();
    })
  );
});

// Fetch event - istekleri önbellekten veya ağdan al
self.addEventListener('fetch', (event) => {
  // Aynı Kaynak Kökenli olmayan istekleri atlayın (CORS, harici API'ler vb.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // GET isteklerini işle
  if (event.request.method !== 'GET') {
    return;
  }

  // URL ve istenen kaynak
  const requestURL = new URL(event.request.url);

  // Sadece belirli statik varlıkları önbelleğe alın
  const isCacheableRequest = CACHEABLE_EXTENSIONS.some(ext => requestURL.pathname.endsWith(ext)) ||
                          SECONDARY_CACHE_ASSETS.some(path => requestURL.pathname.includes(path));

  // API veya dinamik içerik için önbellek kullanma
  if (requestURL.pathname.startsWith('/api/') || requestURL.pathname.includes('/dashboard/')) {
    return;
  }

  // Önbelleğe alınabilir statik varlıklar için "Stale-While-Revalidate" stratejisi
  if (isCacheableRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Arka planda güncellenecek ağ isteği
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Yalnızca başarılı yanıtları önbelleğe alın
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                // Klonlama işlemi - yanıt akışı bir kez kullanılabilir
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((error) => {
              console.log('Ağ isteği başarısız:', error);
              // Ağ hatası, önbellekteki yanıt hala kullanılabilir
              return cachedResponse;
            });

          // Önbellekteki yanıt varsa onu kullan, yoksa ağ isteğini bekle
          return cachedResponse || fetchPromise;
        });
      })
    );
  } 
  // Sayfalar için "Network First, Cache Fallback" stratejisi
  else {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Başarılı yanıtları önbelleğe al
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ağ bağlantısı yoksa önbellekten dene
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Ana sayfa için özel yönlendirme
            if (requestURL.pathname === '/') {
              return caches.match('/');
            }
            
            // Offline sayfa veya hata sayfası
            return caches.match('/offline.html').then(offlinePage => {
              return offlinePage || new Response('İnternet bağlantısı yok.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
          });
        })
    );
  }
});

// Arka planda önbelleği güncelle
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload.urls;
    
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urls))
        .then(() => {
          console.log('URLs önbelleğe alındı:', urls);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ status: 'OK' });
          }
        })
    );
  }
});

// Belirli periyotlarda önbellekteki içeriği temizle ve yeniden yükle
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return Promise.all(PRECACHE_ASSETS.map(url => {
            return fetch(url)
              .then(response => {
                if (response && response.status === 200) {
                  return cache.put(url, response);
                }
                return Promise.resolve();
              })
              .catch(() => Promise.resolve());
          }));
        })
    );
  }
});
