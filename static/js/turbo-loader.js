/**
 * ZekaPark Turbo Loader - Ultra-Hızlı Sayfa Yükleme Sistemi
 * v1.0 - 0ms sayfa geçişleri sağlar
 */

(() => {
  'use strict';

  // Performans yapılandırması
  const TurboConfig = {
    DISABLE_ANIMATIONS: true,          // Tüm animasyonları devre dışı bırak - anlık yükleme
    PRE_CACHE_PAGES: true,             // Bağlantıları önceden önbelleğe al
    USE_SESSION_STORAGE: true,         // sessionStorage kullanarak sayfa içeriklerini sakla
    FORCE_NAVIGATION_REFRESH: false,   // Her sayfayı taze yükle
    CACHE_EXPIRY: 300000,              // Önbellek geçerlilik süresi (5 dk)
    ENABLE_PREFETCH: true,             // Sayfaları önceden getir
    WARM_CONNECTIONS: true,            // CDN'lere önceden bağlan
    STORAGE_KEY: 'turbo_page_cache'    // Önbellek anahtarı
  };

  // Sayfa önbelleği
  const PageCache = {
    // Sayfa önbelleğini kontrol et
    has(url) {
      if (!TurboConfig.USE_SESSION_STORAGE) return false;
      
      try {
        const cache = JSON.parse(sessionStorage.getItem(TurboConfig.STORAGE_KEY) || '{}');
        const cached = cache[url];
        
        if (!cached) return false;
        
        // Önbellek sona erme kontrolü
        const now = Date.now();
        if (now - cached.timestamp > TurboConfig.CACHE_EXPIRY) {
          delete cache[url];
          sessionStorage.setItem(TurboConfig.STORAGE_KEY, JSON.stringify(cache));
          return false;
        }
        
        return true;
      } catch (e) {
        console.warn('Sayfa önbelleği kontrol edilemedi:', e);
        return false;
      }
    },
    
    // Sayfa önbelleğinden al
    get(url) {
      if (!TurboConfig.USE_SESSION_STORAGE) return null;
      
      try {
        const cache = JSON.parse(sessionStorage.getItem(TurboConfig.STORAGE_KEY) || '{}');
        const cached = cache[url];
        
        if (!cached) return null;
        
        // Önbellek sona erme kontrolü
        const now = Date.now();
        if (now - cached.timestamp > TurboConfig.CACHE_EXPIRY) {
          delete cache[url];
          sessionStorage.setItem(TurboConfig.STORAGE_KEY, JSON.stringify(cache));
          return null;
        }
        
        return cached.content;
      } catch (e) {
        console.warn('Sayfa önbelleğinden alınamadı:', e);
        return null;
      }
    },
    
    // Sayfa önbelleğine kaydet
    set(url, content) {
      if (!TurboConfig.USE_SESSION_STORAGE) return;
      
      try {
        const cache = JSON.parse(sessionStorage.getItem(TurboConfig.STORAGE_KEY) || '{}');
        
        // Maksimum 10 sayfa sakla
        const keys = Object.keys(cache);
        if (keys.length > 10) {
          // En eski sayfayı sil
          let oldest = keys[0];
          let oldestTime = cache[oldest].timestamp;
          
          keys.forEach(key => {
            if (cache[key].timestamp < oldestTime) {
              oldest = key;
              oldestTime = cache[key].timestamp;
            }
          });
          
          delete cache[oldest];
        }
        
        // Yeni sayfayı ekle
        cache[url] = {
          content: content,
          timestamp: Date.now()
        };
        
        sessionStorage.setItem(TurboConfig.STORAGE_KEY, JSON.stringify(cache));
      } catch (e) {
        console.warn('Sayfa önbelleğe kaydedilemedi:', e);
      }
    }
  };

  // Sayfa yükleme işlemcisi
  const TurboLoader = {
    // Sayfa bağlantılarını yönet
    setupLinkInterceptors() {
      // Önceden getirme gözlemcisi
      if (TurboConfig.ENABLE_PREFETCH && 'IntersectionObserver' in window) {
        const prefetchObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const link = entry.target;
              if (link.href && link.href.startsWith(window.location.origin)) {
                this.prefetchPage(link.href);
              }
              prefetchObserver.unobserve(link);
            }
          });
        }, { threshold: 0.1 });
        
        // Görünür bağlantıları gözlemle
        document.querySelectorAll('a').forEach(link => {
          if (link.href && link.href.startsWith(window.location.origin)) {
            prefetchObserver.observe(link);
          }
        });
      }
      
      // Bağlantı tıklamalarını yakala
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        
        if (link && 
            link.href && 
            link.href.startsWith(window.location.origin) && 
            !link.getAttribute('download') && 
            !link.classList.contains('no-turbo') && 
            !link.target) {
          
          e.preventDefault();
          
          // Sayfa geçişi yap
          this.navigate(link.href);
        }
      });
      
      // Tarayıcı geri/ileri butonlarını yakala
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.turbo) {
          this.navigate(window.location.href, true);
        }
      });
    },
    
    // Sayfaya git
    navigate(url, isPopState = false) {
      // Zaten mevcut sayfadaysa işlem yapma
      if (url === window.location.href && !isPopState) {
        return;
      }
      
      // Animasyonları devre dışı bırak
      if (TurboConfig.DISABLE_ANIMATIONS) {
        document.documentElement.classList.add('high-performance');
        document.body.classList.add('preload-transition');
      }
      
      // Önbellekte var mı kontrol et
      if (!TurboConfig.FORCE_NAVIGATION_REFRESH && PageCache.has(url)) {
        const cachedContent = PageCache.get(url);
        
        // Sayfa içeriğini güncelle (anında)
        this.updatePageContent(cachedContent);
        
        // Sayfa durumunu güncelle
        if (!isPopState) {
          window.history.pushState({ turbo: true }, '', url);
        }
      } else {
        // Ağdan yükle
        this.fetchPage(url).then(content => {
          // Sayfa içeriğini güncelle (anında)
          this.updatePageContent(content);
          
          // Önbelleğe kaydet
          PageCache.set(url, content);
          
          // Sayfa durumunu güncelle
          if (!isPopState) {
            window.history.pushState({ turbo: true }, '', url);
          }
        }).catch(error => {
          // Hata durumunda normal sayfa yükleme
          console.error('Sayfa yüklenemedi:', error);
          window.location.href = url;
        });
      }
    },
    
    // Sayfa içeriğini fetch et
    async fetchPage(url) {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-Turbo': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.text();
    },
    
    // Sayfa içeriğini önceden getir
    prefetchPage(url) {
      if (PageCache.has(url)) return;
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
      
      // Ayrıca sayfayı önbelleğe al
      if (TurboConfig.PRE_CACHE_PAGES) {
        this.fetchPage(url).then(content => {
          PageCache.set(url, content);
        }).catch(() => {
          // Prefetch hatalarını sessizce yoksay
        });
      }
    },
    
    // Sayfa içeriğini güncelle
    updatePageContent(htmlContent) {
      // Yeni içerikten DOM oluştur
      const parser = new DOMParser();
      const newDocument = parser.parseFromString(htmlContent, 'text/html');
      
      // Mevcut <main> öğesini bul
      const currentMain = document.querySelector('main');
      const newMain = newDocument.querySelector('main');
      
      // Başlık değiştir
      document.title = newDocument.title;
      
      // Meta etiketleri güncelle
      this.updateMetaTags(newDocument);
      
      // İçeriği değiştir (anında)
      if (currentMain && newMain) {
        currentMain.innerHTML = newMain.innerHTML;
      }
      
      // Scriptleri yeniden yükle ve çalıştır
      this.executeScripts(newMain);
      
      // Sayfa geçişi tamamlandı - animasyonları geri aç
      setTimeout(() => {
        document.documentElement.classList.remove('high-performance');
        document.body.classList.remove('preload-transition');
      }, 0);
    },
    
    // Meta etiketlerini güncelle
    updateMetaTags(newDocument) {
      // Önemli meta etiketlerini güncelle
      const metaSelectors = [
        'meta[name="description"]',
        'meta[name="keywords"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
      ];
      
      metaSelectors.forEach(selector => {
        const oldMeta = document.querySelector(selector);
        const newMeta = newDocument.querySelector(selector);
        
        if (oldMeta && newMeta) {
          // Meta içeriğini güncelle
          Array.from(newMeta.attributes).forEach(attr => {
            oldMeta.setAttribute(attr.name, attr.value);
          });
        } else if (newMeta) {
          // Yeni meta ekle
          document.head.appendChild(newMeta.cloneNode(true));
        }
      });
    },
    
    // Script etiketlerini çalıştır
    executeScripts(container) {
      if (!container) return;
      
      // Inline scriptleri çalıştır
      container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Script özelliklerini kopyala
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        
        // Script içeriğini kopyala
        newScript.textContent = oldScript.textContent;
        
        // Yeni scripti ekle (çalıştırılmasını tetikler)
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      });
    },
    
    // CDN'lere önceden bağlan
    warmConnections() {
      if (!TurboConfig.WARM_CONNECTIONS) return;
      
      const domains = [
        'cdn.jsdelivr.net',
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'cdnjs.cloudflare.com'
      ];
      
      domains.forEach(domain => {
        const hint = document.createElement('link');
        hint.rel = 'preconnect';
        hint.href = `//${domain}`;
        hint.crossOrigin = 'anonymous';
        document.head.appendChild(hint);
      });
    },
    
    // Başlangıç
    initialize() {
      // CDN bağlantılarını ısıt
      this.warmConnections();
      
      // Bağlantı yakalayıcıları kur
      this.setupLinkInterceptors();
      
      // İlk sayfa yüklemesi için geçmiş durumunu ayarla
      window.history.replaceState({ turbo: true }, '', window.location.href);
      
      // Mevcut sayfayı önbelleğe al
      if (TurboConfig.USE_SESSION_STORAGE) {
        PageCache.set(window.location.href, document.documentElement.outerHTML);
      }
    }
  };
  
  // DOM yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', () => {
    TurboLoader.initialize();
  });
  
  // DOMContentLoaded olayını kaçırdıysa
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    TurboLoader.initialize();
  }
})();
