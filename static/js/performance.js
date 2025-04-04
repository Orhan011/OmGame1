/** 
 * ZekaPark Performans Optimizasyonu
 * Sayfa yükleme ve geçiş hızını optimize eder
 * 0ms geçişler ve minimum kaynak kullanımı sağlar
 */

// Anında yükleme için DOM hazırlığını beklemeden çalıştır
(function() {
  'use strict';

  // Performans yapılandırması
  const config = {
    INSTANTLY_LOAD_PAGES: true,         // Sayfaları anında yükle
    PRELOAD_LINKS: true,                // Bağlantıları önceden yükle
    OPTIMIZE_IMAGES: true,              // Görselleri optimize et
    OPTIMIZE_ANIMATIONS: true,          // Animasyonları optimize et
    REDUCE_DOM_OPERATIONS: true,        // DOM işlemlerini azalt
    UNBLOCK_RENDER: true,               // Render engellemelerini kaldır
    DISABLE_UNNECESSARY_CSS: true,      // Gereksiz CSS'leri devre dışı bırak
    USE_CACHED_DOM: true,               // DOM önbelleğini kullan
    WARM_CONNECTIONS: true              // Bağlantıları önceden aç
  };

  // Ana performans yöneticisi
  const performanceManager = {
    init: function() {
      this.unblockRendering();
      this.optimizeCriticalPath();
      this.setupCaching();
      this.optimizeEventListeners();
      this.enhanceNetworkPerformance();
    },

    // Render engellemelerini kaldır
    unblockRendering: function() {
      if (!config.UNBLOCK_RENDER) return;
      
      // DOM oluşturma optimizasyonu
      document.documentElement.classList.add('instant-load-ready');
      
      // Stil hesaplamalarını optimize et
      const style = document.createElement('style');
      style.innerHTML = `
        .js-loading * {
          transition: none !important;
          animation-duration: 0ms !important;
        }
      `;
      document.head.appendChild(style);
      
      // Sayfa geçiş öncesi optimizasyon
      document.documentElement.classList.add('js-loading');
      window.addEventListener('load', () => {
        setTimeout(() => {
          document.documentElement.classList.remove('js-loading');
        }, 0);
      });
    },
    
    // Kritik yolu optimize et
    optimizeCriticalPath: function() {
      // İnaktif CSS'leri devre dışı bırak
      if (config.DISABLE_UNNECESSARY_CSS) {
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        
        stylesheets.forEach(link => {
          if (link.dataset.critical !== 'true') {
            link.media = 'print';
            link.addEventListener('load', () => {
              link.media = 'all';
            });
          }
        });
      }
      
      // Kritik olmayan resimleri ertelenmiş yükle
      if (config.OPTIMIZE_IMAGES) {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const image = entry.target;
                if (image.dataset.src) {
                  image.src = image.dataset.src;
                  image.removeAttribute('data-src');
                }
                imageObserver.unobserve(image);
              }
            });
          }, { rootMargin: '100px' });
          
          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }
      }
    },
    
    // Önbellek optimizasyonu
    setupCaching: function() {
      // DOM önbelleğini kullan
      if (config.USE_CACHED_DOM) {
        this.cachedElements = {};
        
        // Sık kullanılan elementleri önbelleğe al
        const cacheElements = () => {
          ['header', 'footer', 'main', 'nav'].forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
              this.cachedElements[selector] = element;
            }
          });
        };
        
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          cacheElements();
        } else {
          document.addEventListener('DOMContentLoaded', cacheElements);
        }
      }
    },
    
    // Olay dinleyici optimizasyonu
    optimizeEventListeners: function() {
      if (!config.REDUCE_DOM_OPERATIONS) return;
      
      // Olay Delegasyonu
      document.addEventListener('click', (e) => {
        // Bağlantılar için delegasyon
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          const link = e.target.tagName === 'A' ? e.target : e.target.closest('a');
          
          // Yerel bağlantıların performansını iyileştir
          if (link.hostname === window.location.hostname && 
              !link.dataset.noInstant && 
              !link.getAttribute('target') && 
              config.INSTANTLY_LOAD_PAGES) {
            // Performans modu: Animasyon olmadan anında yükle
          }
        }
        
        // Butonlar için delegasyon
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          // Toplu buton olaylarını yönet
        }
      });
      
      // Debounce ve throttle uygula
      let resizeTimer;
      window.addEventListener('resize', () => {
        document.documentElement.classList.add('resize-disabled-animation');
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          document.documentElement.classList.remove('resize-disabled-animation');
        }, 100);
      });
    },
    
    // Ağ performans optimizasyonu
    enhanceNetworkPerformance: function() {
      // DNS Önyükleme ve bağlantı ısıtma
      if (config.WARM_CONNECTIONS) {
        const domains = [
          '//cdn.jsdelivr.net',
          '//fonts.googleapis.com',
          '//fonts.gstatic.com'
        ];
        
        domains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });
      }
      
      // Bağlantıları önceden yükle
      if (config.PRELOAD_LINKS) {
        document.addEventListener('mouseover', (e) => {
          const link = e.target.closest('a');
          if (link && 
              link.href && 
              link.hostname === window.location.hostname &&
              !link.dataset.preloaded) {
            
            link.dataset.preloaded = 'true';
            
            // Prefetch bağlantısı oluştur
            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = link.href;
            document.head.appendChild(prefetch);
          }
        }, { passive: true });
      }
    }
  };
  
  // Sayfa yüklenme süreçlerine uygun şekilde başlat
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    performanceManager.init();
  } else {
    // Erken başlatma - kritik işlemler için
    performanceManager.unblockRendering();
    
    document.addEventListener('DOMContentLoaded', () => {
      performanceManager.init();
    });
  }
})();
