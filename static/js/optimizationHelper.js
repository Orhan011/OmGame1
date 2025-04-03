
/**
 * ZekaPark Performans Optimizasyon Yardımcısı
 * Web sitenizin performansını artırmak ve hataları önlemek için çeşitli araçlar sağlar
 */

// DOM Yükleme Geribildirimini geliştir
document.addEventListener('DOMContentLoaded', function() {
  console.log('ZekaPark UI yüklendi');
  
  // ResizeObserver polyfill - eski tarayıcılar için destek ekler
  if (!window.ResizeObserver) {
    window.ResizeObserver = function(callback) {
      this.observe = function(target) {
        // Basit resize olayı desteği
        window.addEventListener('resize', function() {
          callback([{target: target}]);
        });
      };
      this.unobserve = function() {};
      this.disconnect = function() {};
    };
  }
  
  // Yükleme performansını ölç
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    
    // Yavaş yükleme durumunda konsola bildirim
    if (pageLoadTime > 3000) {
      console.warn('Sayfa yükleme süresi: ' + pageLoadTime + 'ms - Iyileştirme gerekebilir');
    }
  }
  
  // Görüntü optimizasyonu - Görünmeyen resimlerin yüklenmesini geciktir
  document.querySelectorAll('img[data-src]').forEach(img => {
    // Görüntü görünür olduğunda yükle
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
    
    observer.observe(img);
  });
  
  // Sayfa geçişlerinde daha iyi animasyon kontrolü
  document.querySelectorAll('a').forEach(link => {
    // Sadece aynı domain içindeki bağlantılar için
    if (link.hostname === window.location.hostname && !link.getAttribute('target')) {
      link.addEventListener('click', function(e) {
        // İşlemi önlemek için herhangi bir neden var mı?
        const preventAnimation = link.classList.contains('no-transition') || 
                                e.ctrlKey || e.metaKey || e.shiftKey;
        
        if (!preventAnimation) {
          // Sayfa geçiş animasyonu ekleyebilirsiniz
          // Bu örnekte sadece performans için hazırlık yapılıyor
          document.body.classList.add('page-transition');
          
          // Bir sonraki sayfada geçiş etki animasyonunu kaldır
          setTimeout(() => {
            document.body.classList.remove('page-transition');
          }, 100);
        }
      });
    }
  });
});

// Sayfa tamamen yüklendiğinde performans iyileştirmeleri yap
window.addEventListener('load', function() {
  // Sayfa tamamen yüklendi, ek kaynakları şimdi yükleyebiliriz
  
  // Kullanılmayan JS'leri gecikmeli yükle
  setTimeout(() => {
    // Örnek: İsteğe bağlı script yükleme
    const optionalScripts = document.querySelectorAll('script[data-optional]');
    optionalScripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      
      // Script niteliklerini kopyala
      Array.from(script.attributes).forEach(attr => {
        if (attr.name !== 'data-optional') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      
      // Eski script'i yenisiyle değiştir
      script.parentNode.replaceChild(newScript, script);
    });
  }, 1000);
  
  // Web sayfasının etkileşim performansını artır
  requestIdleCallback(() => {
    // Sayfa yüklendikten sonra ve tarayıcı boşta olduğunda çalışır
    
    // Animasyon ve geçişleri optimize et
    document.body.classList.add('transitions-ready');
    
    // Konsol uyarılarını gizle (sadece production ortamında)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn = function() {};
      console.error = function(msg) {
        // Kritik hataları bir hata toplama servisine gönderebilirsiniz
      };
    }
  });
});

// Yardımcı fonksiyonlar 
const Helpers = {
  // DOM elementlerine güvenli erişim
  getElement: function(id) {
    return document.getElementById(id);
  },
  
  // LocalStorage'a güvenli erişim
  safeStorage: {
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('LocalStorage yazma hatası:', e.message);
        return false;
      }
    },
    
    get: function(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn('LocalStorage okuma hatası:', e.message);
        return defaultValue;
      }
    }
  },
  
  // Event listener'ları güvenli şekilde ekle
  addEvent: function(element, event, callback) {
    if (element && typeof element.addEventListener === 'function') {
      element.addEventListener(event, callback);
      return true;
    }
    return false;
  },
  
  // İstemci tarafı yönlendirme
  navigate: function(url) {
    try {
      // Önceki sayfayı geçmişe ekle
      const navHistory = Helpers.safeStorage.get('navigationHistory', []);
      navHistory.push(window.location.href);
      Helpers.safeStorage.set('navigationHistory', navHistory);
      
      // Yeni sayfaya git
      window.location.href = url;
    } catch (e) {
      // Hata durumunda doğrudan yönlendir
      window.location.href = url;
    }
  }
};

// Global olarak erişilebilir yap
window.ZekaHelpers = Helpers;
