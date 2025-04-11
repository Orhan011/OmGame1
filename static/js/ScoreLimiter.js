/**
 * ScoreLimiter.js - Puan Sınırlayıcı
 * 
 * Bu script, tüm oyunların 10-100 arasında puan vermesini sağlar.
 * Backend API'ye gönderilen tüm skorları kontrol eder ve istenen aralığa getirme işlemini yapar.
 */
(function() {
  "use strict";
  
  // Başlangıç ayarları
  const config = {
    minScore: 10,      // Minimum skor değeri
    maxScore: 100,     // Maksimum skor değeri
    defaultScore: 50   // Varsayılan skor değeri
  };
  
  // Güvenlik önlemi için boş bir fetch sürümü
  let originalFetch = window.fetch || function() { 
    return Promise.reject(new Error('fetch is not supported')); 
  };
  
  /**
   * Başlangıç fonksiyonu
   */
  function initialize() {
    console.log("🔒 ScoreLimiter başlatılıyor...");
    
    // API isteklerini yakala
    interceptFetchAPI();
    interceptXHRAPI();
    
    // Oyun tamamlandı olayını dinle
    listenForGameCompleted();
    
    console.log("✅ ScoreLimiter başlatıldı");
  }
  
  /**
   * Fetch API'yi yakala
   */
  function interceptFetchAPI() {
    // Eğer Fetch API varsa
    if (typeof window.fetch === 'function') {
      // Orijinal fetch fonksiyonunu sakla
      originalFetch = window.fetch;
      
      // Fetch fonksiyonunu override et
      window.fetch = function() {
        const resource = arguments[0];
        const options = arguments[1] || {};
        
        // İstek URL'sini kontrol et
        if (typeof resource === 'string' && resource.includes('/save-score')) {
          return handleScoreAPIRequest(resource, options, 'fetch');
        } 
        // Request nesnesi kontrolü
        else if (resource && typeof resource === 'object' && 
                 resource.url && resource.url.includes('/save-score')) {
          return handleScoreAPIRequest(resource.url, options, 'fetch');
        }
        
        // Değilse normal fetch'i çağır
        return originalFetch.apply(this, arguments);
      };
      
      console.log("✅ Fetch API yakalandı");
    }
  }
  
  /**
   * XMLHttpRequest'i yakala
   */
  function interceptXHRAPI() {
    // Eğer XMLHttpRequest varsa
    if (typeof window.XMLHttpRequest === 'function') {
      // Orijinal XMLHttpRequest sınıfını sakla
      const originalXHR = window.XMLHttpRequest;
      
      // XMLHttpRequest'i override et
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        // Open metodunu yakala
        xhr.open = function() {
          // URL'yi sakla
          this._url = arguments[1];
          return originalOpen.apply(this, arguments);
        };
        
        // Send metodunu yakala
        xhr.send = function() {
          // URL, skor API'si ile ilgiliyse
          if (this._url && typeof this._url === 'string' && this._url.includes('/save-score')) {
            // POST isteği için gövde var mı kontrol et
            if (arguments[0]) {
              try {
                // Gövdeyi parse et
                const body = JSON.parse(arguments[0]);
                // Skor alanını limite uygun hale getir
                if (body && typeof body.score !== 'undefined') {
                  body.score = limitScore(body.score);
                  // Yeni gövdeyi oluştur ve isteği gönder
                  return originalSend.call(this, JSON.stringify(body));
                }
              } catch (e) {
                console.error('XHR veri işleme hatası:', e);
              }
            }
          }
          
          // Normal send'i çağır
          return originalSend.apply(this, arguments);
        };
        
        return xhr;
      };
      
      console.log("✅ XHR API yakalandı");
    }
  }
  
  /**
   * Skor API isteğini işle
   */
  function handleScoreAPIRequest(url, options, type) {
    // POST isteği mi kontrol et
    if (options.method === 'POST' && options.body) {
      try {
        // Body'i parse et
        let body;
        
        if (typeof options.body === 'string') {
          body = JSON.parse(options.body);
        } else if (options.body instanceof FormData) {
          console.warn('FormData formatındaki verileri işleyemiyoruz');
          return originalFetch(url, options);
        } else {
          body = options.body;
        }
        
        // Skoru kontrol et ve sınırlandır
        if (body && typeof body.score !== 'undefined') {
          const originalScore = body.score;
          body.score = limitScore(body.score);
          
          // Değişiklik olduysa bildir
          if (originalScore !== body.score) {
            console.log(`🔄 Skor sınırlandırıldı: ${originalScore} → ${body.score}`);
          }
          
          // Yeni body oluştur
          const newOptions = { ...options, body: JSON.stringify(body) };
          
          // API yanıtını dinle
          return originalFetch(url, newOptions).then(response => {
            // Yanıtı clone'la ve işle
            const clonedResponse = response.clone();
            
            clonedResponse.json().then(data => {
              // Skorun API tarafından nasıl döndüğünü bildir
              console.log('💯 API yanıtı skor:', data.points?.total || data.score);
              
              // Gerçek skor değerini yay
              dispatchScoreEvent(data.points?.total || data.score);
            });
            
            return response;
          });
        }
      } catch (e) {
        console.error('Skor API isteği işleme hatası:', e);
      }
    }
    
    // Değişiklik yapılamıyorsa normal fetch'i çağır
    return originalFetch(url, options);
  }
  
  /**
   * Bir skoru belirtilen sınırlar arasında tutma
   */
  function limitScore(score) {
    // Sayısal değere dönüştür
    let numericScore = Number(score);
    
    // Sayı değilse varsayılan değer kullan
    if (isNaN(numericScore)) {
      return config.defaultScore;
    }
    
    // Sınırlar içinde tut
    return Math.max(config.minScore, Math.min(config.maxScore, numericScore));
  }
  
  /**
   * gameCompleted olayını dinleme
   */
  function listenForGameCompleted() {
    document.addEventListener('gameCompleted', function(e) {
      if (e.detail && typeof e.detail.score !== 'undefined') {
        // Skoru sınırlandır
        const originalScore = e.detail.score;
        const limitedScore = limitScore(originalScore);
        
        // Skoru güncelle
        e.detail.score = limitedScore;
        
        // Değişiklik varsa bildir
        if (originalScore !== limitedScore) {
          console.log(`🔄 Olay skoru sınırlandırıldı: ${originalScore} → ${limitedScore}`);
        }
      }
    });
  }
  
  /**
   * Gerçek skor olayını yayma
   */
  function dispatchScoreEvent(score) {
    document.dispatchEvent(new CustomEvent('realScoreReceived', {
      detail: { score: score }
    }));
  }
  
  // Dışa açık API
  window.ScoreLimiter = {
    initialize: initialize,
    limitScore: limitScore,
    setScoreLimits: function(min, max) {
      config.minScore = min;
      config.maxScore = max;
    }
  };
  
  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();