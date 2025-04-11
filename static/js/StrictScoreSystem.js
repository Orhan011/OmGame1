/**
 * StrictScoreSystem.js - Katı Puan Sistemi
 * 
 * Bu sistem, tüm oyunların 10-100 arası puanlamaya uymasını ve oyun sonu ekranlarında
 * sadece gerçek API tarafından hesaplanan puanların gösterilmesini sağlar.
 * Rastgele puan üretimini tüm oyunlarda engeller ve standardize eder.
 */
(function() {
  "use strict";
  
  // Başlatma fonksiyonu
  function initialize() {
    console.log("🔒 StrictScoreSystem başlatılıyor...");
    
    // Math.random ve diğer rastgele fonksiyonları kontrol altına alma
    overrideMathRandom();
    
    // Network API'lerini yakalama (API yanıtlarını kontrol etmek için)
    interceptFetchAPI();
    interceptXhrAPI();
    
    // API yanıtlarını dinleme ve yakalama
    setupApiListener();
    
    // DOM değişikliklerini izleme
    setupDomObserver();
    
    // Periyodik olarak sonuç ekranlarını temizleme
    setupPeriodicCleanup();
    
    console.log("✅ StrictScoreSystem başlatıldı");
  }
  
  // Global değişkenler
  const _internals = {
    // En son gerçek skor (API'den)
    realScore: null,
    
    // Puan aralığı limitleri
    minScore: 10,
    maxScore: 100,
    
    // Temizleme sayacı
    cleanupCounter: 0,
    
    // Skor stack'i (her yerden gelen puanları topla, sadece API'den geleni kullan)
    scoreStack: [],
    
    // Elem seçici sorgular
    selectors: {
      resultContainers: [
        '.game-over-container', '.game-over', '.results-container', '.score-container',
        '.game-result', '.result-screen', '.score-display', '.stat-screen',
        '.final-score-container', '.stats-container', '.result-modal',
        '.game-stats', '.result-screen', '#game-over-container', '#results-container'
      ],
      scoreElements: [
        '#final-score', '.final-score', '.score-value', '.result-value', 
        '.game-result-score', '.game-score', '#finalScore', '[id$="-score"]',
        '.result-stat-value', '.stat-value', '.score', '.points', '.game-points',
        '.results-score', '.final-score-value', '.score-number'
      ],
      elementsToHide: [
        '.rating-stars', '.rating-text', '.rating-container', '.stats-element:not(.score)',
        '.performance-text', '.performance-stars', '.streak-display', '.extra-stats',
        '.achievements', '.bonus-points', '.time-bonus', '.move-penalty', '.hint-penalty'
      ]
    }
  };
  
  /**
   * Math.random fonksiyonunu override eder
   * Böylelikle rastgele skor üretimini engeller ve öngörülebilir puanlar sağlar
   */
  function overrideMathRandom() {
    const originalRandom = Math.random;
    const originalRandomInt = window.getRandomInt || null;
    const originalRandomNum = window.randomNumber || null;
    
    // Math.random yerine özel fonksiyon
    Math.random = function() {
      // Kaynağını görmek için yığın izi al
      const stackTrace = new Error().stack || "";
      
      // Eğer bu, bir skor hesaplama bağlamında kullanılıyorsa
      if (isInScoreContext(stackTrace)) {
        return 0.75; // Sabit değer (çoğu oyunda makul puanlar üretir)
      }
      
      // Oyun mantığı için normal rastgele değeri döndür
      return originalRandom.apply(this, arguments);
    };
    
    // getRandomInt fonksiyonunu override et (varsa)
    if (typeof window.getRandomInt === 'function') {
      window.getRandomInt = function(min, max) {
        if (isInScoreContext()) {
          // Bu skor hesaplama için kullanılıyorsa, sabit değer döndür
          const value = _internals.realScore || Math.floor((min + max) / 2);
          return Math.max(min, Math.min(max, value)); // Sınırlar içinde tut
        }
        return originalRandomInt.apply(this, arguments);
      };
    }
    
    // randomNumber fonksiyonunu override et (varsa)
    if (typeof window.randomNumber === 'function') {
      window.randomNumber = function(min, max) {
        if (isInScoreContext()) {
          // Bu skor hesaplama için kullanılıyorsa, sabit değer döndür
          const value = _internals.realScore || Math.floor((min + max) / 2);
          return Math.max(min, Math.min(max, value)); // Sınırlar içinde tut
        }
        return originalRandomNum.apply(this, arguments);
      };
    }
    
    console.log("✅ Math fonksiyonları kontrol altına alındı");
  }
  
  /**
   * Mevcut yığın izlemesinin skor bağlamında olup olmadığını kontrol eder
   */
  function isInScoreContext(stack) {
    stack = stack || new Error().stack || "";
    
    // Skor hesaplama ile ilgili yaygın fonksiyon isimleri
    const scoreContextKeywords = [
      "calculateScore", "getScore", "computeScore", "displayScore", "showScore",
      "updateScore", "finalScore", "endGame", "gameOver", "displayResult", 
      "showResult", "displayStats", "showStats", "displayGameOver"
    ];
    
    // Bu kelimelerden herhangi birini içeriyorsa, skor bağlamındadır
    for (const keyword of scoreContextKeywords) {
      if (stack.includes(keyword)) return true;
    }
    
    // Ayrıca, şu an bir sonuç ekranı görüntüleniyorsa, o da skor bağlamındadır
    return isResultScreenVisible();
  }
  
  /**
   * Şu an bir sonuç ekranının görüntülenip görüntülenmediğini kontrol eder
   */
  function isResultScreenVisible() {
    // Tüm olası sonuç ekranı konteynerlerini kontrol et
    for (const selector of _internals.selectors.resultContainers) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // Element görünür mü?
        if (element && 
          (getComputedStyle(element).display !== 'none' && 
           getComputedStyle(element).visibility !== 'hidden')) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Fetch API'yi yakalayarak gerçek skor verileri için izler
   */
  function interceptFetchAPI() {
    if (typeof window.fetch === 'function') {
      const originalFetch = window.fetch;
      
      window.fetch = function(resource, options) {
        // URL'i kontrol et
        let url = resource;
        if (typeof resource === 'object' && resource.url) {
          url = resource.url;
        }
        
        // Eğer bu bir skor API'si isteği ise, yanıtı izle
        if (typeof url === 'string' && (url.includes('/save-score') || url.includes('/scores'))) {
          return originalFetch.apply(this, arguments)
            .then(response => {
              const clonedResponse = response.clone();
              
              // JSON yanıtını işle ve skor verisini yakala
              clonedResponse.json().then(data => {
                if (data && (data.success || data.points)) {
                  const actualScore = data.points?.total || data.score || 0;
                  
                  console.log("💯 API'den gerçek skor alındı:", actualScore);
                  
                  // Gerçek skoru sakla
                  _internals.realScore = actualScore;
                  
                  // Bu skoru global olarak kaydet
                  window.realApiScore = actualScore;
                  
                  // API yanıtını global olarak yayınla
                  dispatchScoreUpdateEvent(actualScore);
                  
                  // Sonuç ekranlarını temizle ve güncelle
                  setTimeout(cleanupResultScreens, 100);
                }
              }).catch(err => {
                console.error("API yanıtı işlenirken hata:", err);
              });
              
              return response;
            });
        }
        
        // Normal fetch çağrısı
        return originalFetch.apply(this, arguments);
      };
      
      console.log("✅ Fetch API yakalandı");
    }
  }
  
  /**
   * XMLHttpRequest'i yakalar
   */
  function interceptXhrAPI() {
    if (typeof window.XMLHttpRequest === 'function') {
      const originalXHR = window.XMLHttpRequest;
      
      // XMLHttpRequest constructor'ını override et
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        // open metodunu override et
        xhr.open = function() {
          // URL'yi depola
          this._url = arguments[1] || '';
          return originalOpen.apply(this, arguments);
        };
        
        // send metodunu override et
        xhr.send = function() {
          // Eğer bu bir skor API'si isteği ise, yanıtı izle
          if (this._url && typeof this._url === 'string' && 
             (this._url.includes('/save-score') || this._url.includes('/scores'))) {
             
            // Yanıtı dinle
            this.addEventListener('load', function() {
              try {
                // Yanıtı parse et
                const data = JSON.parse(this.responseText);
                
                if (data && (data.success || data.points)) {
                  const actualScore = data.points?.total || data.score || 0;
                  
                  console.log("💯 XHR API'den gerçek skor alındı:", actualScore);
                  
                  // Gerçek skoru sakla
                  _internals.realScore = actualScore;
                  
                  // Bu skoru global olarak kaydet
                  window.realApiScore = actualScore;
                  
                  // API yanıtını global olarak yayınla
                  dispatchScoreUpdateEvent(actualScore);
                  
                  // Sonuç ekranlarını temizle ve güncelle
                  setTimeout(cleanupResultScreens, 100);
                }
              } catch (err) {
                console.error("XHR yanıtı işlenirken hata:", err);
              }
            });
          }
          
          return originalSend.apply(this, arguments);
        };
        
        return xhr;
      };
      
      console.log("✅ XMLHttpRequest yakalandı");
    }
  }
  
  /**
   * API dinleyicilerini kurar
   */
  function setupApiListener() {
    // Özel skor olayını dinle
    document.addEventListener('gameCompleted', function(e) {
      if (e.detail && typeof e.detail.score !== 'undefined') {
        const score = parseInt(e.detail.score);
        
        // Bu puanı stack'e ekle
        _internals.scoreStack.push(score);
        
        // En son için ortalama bir değer hesapla
        const avgScore = _internals.scoreStack.reduce((sum, s) => sum + s, 0) / _internals.scoreStack.length;
        
        // 10-100 aralığında sınırlandır
        const limitedScore = Math.max(_internals.minScore, Math.min(_internals.maxScore, Math.round(avgScore)));
        
        console.log("🎮 Oyun tamamlandı olayından skor alındı:", limitedScore);
        
        // Eğer henüz API'den gerçek bir skor almadıysak, bunu geçici olarak kullan
        if (!_internals.realScore) {
          _internals.realScore = limitedScore;
          
          // Sonuç ekranlarını güncelle
          setTimeout(cleanupResultScreens, 100);
        }
      }
    });
    
    // ScoreHandler API yanıtlarını dinle
    document.addEventListener('scoreApiResponse', function(e) {
      if (e.detail && e.detail.data) {
        const data = e.detail.data;
        const actualScore = data.points?.total || data.score || 0;
        
        console.log("💯 ScoreHandler API'den gerçek skor alındı:", actualScore);
        
        // Gerçek skoru sakla
        _internals.realScore = actualScore;
        
        // Bu skoru global olarak kaydet
        window.realApiScore = actualScore;
        
        // Sonuç ekranlarını temizle ve güncelle
        setTimeout(cleanupResultScreens, 100);
      }
    });
    
    // Özel gerçek skor olayını dinle
    document.addEventListener('realScoreReceived', function(e) {
      if (e.detail && typeof e.detail.score !== 'undefined') {
        const score = parseInt(e.detail.score);
        
        console.log("💯 Özel olay ile gerçek skor alındı:", score);
        
        // Gerçek skoru sakla
        _internals.realScore = score;
        
        // Bu skoru global olarak kaydet
        window.realApiScore = score;
        
        // Sonuç ekranlarını temizle ve güncelle
        setTimeout(cleanupResultScreens, 100);
      }
    });
    
    console.log("✅ API dinleyicileri kuruldu");
  }
  
  /**
   * Özel skor update olayını yayar
   */
  function dispatchScoreUpdateEvent(score) {
    document.dispatchEvent(new CustomEvent('realScoreReceived', {
      detail: { score: score }
    }));
  }
  
  /**
   * DOM değişikliklerini dinler
   */
  function setupDomObserver() {
    try {
      // Yeni MutationObserver oluştur
      const observer = new MutationObserver(function(mutations) {
        let shouldCleanup = false;
        
        for (const mutation of mutations) {
          // Yeni eklenen nodeları kontrol et
          if (mutation.addedNodes && mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              
              // Element türünde bir node mu?
              if (node.nodeType === 1) {
                // Bu bir sonuç ekranı mı kontrol et
                if (node.className && typeof node.className === 'string') {
                  for (const keyword of ['result', 'score', 'game-over', 'stats']) {
                    if (node.className.indexOf(keyword) !== -1) {
                      shouldCleanup = true;
                      break;
                    }
                  }
                }
                
                // ID'si sonuç ekranı mı kontrol et
                if (node.id && typeof node.id === 'string') {
                  for (const keyword of ['result', 'score', 'game-over', 'stats']) {
                    if (node.id.indexOf(keyword) !== -1) {
                      shouldCleanup = true;
                      break;
                    }
                  }
                }
              }
            }
          }
          
          // Style değişikliklerini kontrol et
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' &&
              mutation.target.style) {
            
            const style = mutation.target.style;
            
            // Görünürlük değişikliği var mı?
            if (style.display === 'block' || style.display === 'flex' || style.visibility === 'visible') {
              // Bu bir sonuç ekranı mı kontrol et
              if (mutation.target.className && typeof mutation.target.className === 'string') {
                for (const keyword of ['result', 'score', 'game-over', 'stats']) {
                  if (mutation.target.className.indexOf(keyword) !== -1) {
                    shouldCleanup = true;
                    break;
                  }
                }
              }
              
              // ID'si sonuç ekranı mı kontrol et
              if (mutation.target.id && typeof mutation.target.id === 'string') {
                for (const keyword of ['result', 'score', 'game-over', 'stats']) {
                  if (mutation.target.id.indexOf(keyword) !== -1) {
                    shouldCleanup = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Class değişikliklerini kontrol et
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'class') {
            
            // Bu class sonuç ekranı ile ilgili mi kontrol et
            if (mutation.target.className && typeof mutation.target.className === 'string') {
              for (const keyword of ['active', 'show', 'visible', 'open']) {
                if (mutation.target.className.indexOf(keyword) !== -1) {
                  // Hem class hem de container ilgili mi kontrol et
                  for (const container of _internals.selectors.resultContainers) {
                    if (mutation.target.className.indexOf(container.replace('.', '')) !== -1) {
                      shouldCleanup = true;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
        
        // Eğer temizlik gerekliyse
        if (shouldCleanup) {
          console.log("🧹 DOM değişikliği - sonuç ekranı tespit edildi");
          cleanupResultScreens();
        }
      });
      
      // Tüm DOM'u izle
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id']
      });
      
      console.log("✅ DOM izleyicisi başlatıldı");
    } catch (err) {
      console.error("DOM izleyicisi başlatılırken hata:", err);
    }
  }
  
  /**
   * Periyodik temizleme başlatır
   */
  function setupPeriodicCleanup() {
    const ITERATION_LIMIT = 30;
    
    // İlk temizlemeyi hemen yap
    cleanupResultScreens();
    
    // Sonra periyodik olarak devam et
    const interval = setInterval(function() {
      _internals.cleanupCounter++;
      
      if (_internals.cleanupCounter < ITERATION_LIMIT) {
        cleanupResultScreens();
      } else {
        clearInterval(interval);
        console.log("✓ Periyodik temizleme durduruldu (" + ITERATION_LIMIT + " iterasyon tamamlandı)");
      }
    }, 1000);
    
    console.log("✅ Periyodik temizleme başlatıldı");
  }
  
  /**
   * Sonuç ekranlarını temizler ve sadece gerçek puanları gösterir
   */
  function cleanupResultScreens() {
    try {
      // Sonuç konteynerlerini bul
      for (const selector of _internals.selectors.resultContainers) {
        const containers = document.querySelectorAll(selector);
        
        for (const container of containers) {
          // Bu konteyneri zaten temizledik mi?
          if (container.hasAttribute('data-score-cleaned')) {
            continue;
          }
          
          // İstatistik elemanlarını bul
          const statElements = container.querySelectorAll('*');
          let scoreElement = null;
          
          // İstatistik elemanlarını işle - sadece skor içerenleri tut
          for (const element of statElements) {
            const text = element.textContent.toLowerCase();
            
            // Eleman skor içeriyor mu?
            if (text.includes('puan') || text.includes('skor') || text.includes('score') || text.includes('point')) {
              if (!scoreElement) {
                scoreElement = element;
                
                // Stil düzenlemeleri
                element.style.display = 'flex';
                element.style.flexDirection = 'column';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
                element.style.width = '100%';
                element.style.textAlign = 'center';
                element.style.margin = '20px 0';
              }
            } 
            // Gizlenmesi gereken elementleri kontrol et
            else {
              for (const hideSelector of _internals.selectors.elementsToHide) {
                if (element.matches && element.matches(hideSelector)) {
                  element.style.display = 'none';
                }
              }
            }
          }
          
          // Spesifik skor elementlerini bul
          for (const scoreSelector of _internals.selectors.scoreElements) {
            const elements = container.querySelectorAll(scoreSelector);
            
            for (const element of elements) {
              const currentValue = parseInt(element.textContent) || 0;
              
              // Element görünür mü?
              if (getComputedStyle(element).display !== 'none') {
                // Görsel iyileştirmeler
                enhanceScoreElement(element);
                
                // Gerçek skoru göster
                if (_internals.realScore !== null) {
                  // Çok farklı bir değer varsa güncelle
                  if (Math.abs(currentValue - _internals.realScore) > 5) {
                    animateScoreChange(element, currentValue, _internals.realScore);
                  }
                } 
                // Gerçek skor henüz alınmadıysa, en azından 10-100 arası sınırlandır
                else if (currentValue < _internals.minScore || currentValue > _internals.maxScore) {
                  const limitedScore = Math.max(_internals.minScore, Math.min(_internals.maxScore, currentValue));
                  element.textContent = limitedScore;
                }
              }
            }
          }
          
          // Bu konteyneri işaretleyelim
          container.setAttribute('data-score-cleaned', 'true');
        }
      }
    } catch (err) {
      console.error("Sonuç ekranları temizlenirken hata:", err);
    }
  }
  
  /**
   * Skor elementini görsel olarak iyileştirir
   */
  function enhanceScoreElement(element) {
    try {
      if (!element) return;
      
      // Element türüne göre stil uygula
      element.style.fontSize = '2.5rem';
      element.style.fontWeight = 'bold';
      element.style.color = '#6a5ae0';
      element.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
      element.style.padding = '10px 0';
      element.style.textAlign = 'center';
    } catch (err) {
      console.error("Skor elementi iyileştirilirken hata:", err);
    }
  }
  
  /**
   * Skor değişimini animasyonlu gösterir
   */
  function animateScoreChange(element, startValue, endValue) {
    try {
      if (!element) return;
      
      // Değerler aynıysa işlem yapma
      if (startValue === endValue) return;
      
      const duration = 1000; // 1 saniye
      const startTime = performance.now();
      
      function animate(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Yavaşlayan hareket
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Şu anki değeri hesapla
        const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
        
        // Elementi güncelle
        element.textContent = currentValue;
        
        // Animasyon devam ediyorsa bir sonraki kareyi çiz
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      // Animasyonu başlat
      requestAnimationFrame(animate);
    } catch (err) {
      console.error("Skor animasyonu hatası:", err);
      // Hata durumunda direkt değeri güncelle
      if (element) element.textContent = endValue;
    }
  }
  
  /**
   * Standarize edilmiş skor hesaplama fonksiyonu 
   * (Oyunlar doğrudan bunu kullanabilir)
   */
  function calculateStandardScore(params) {
    try {
      // Varsayılan parametreler
      const {
        baseScore = 50,               // Temel puan
        performanceMultiplier = 1.0,  // Performans çarpanı 
        difficultyMultiplier = 1.0,   // Zorluk çarpanı
        timeBonus = 0,                // Zaman bonusu
        accuracyBonus = 0,            // Doğruluk bonusu
        penaltyPoints = 0,            // Ceza puanları
        hints = 0,                    // Kullanılan ipucu sayısı
        hintPenalty = 5               // İpucu başına ceza
      } = params || {};
      
      // Ham puanı hesapla
      let rawScore = baseScore * performanceMultiplier * difficultyMultiplier;
      
      // Bonusları ekle
      rawScore += timeBonus + accuracyBonus;
      
      // Cezaları çıkar
      rawScore -= penaltyPoints;
      
      // İpucu cezasını çıkar
      rawScore -= hints * hintPenalty;
      
      // 10-100 aralığında sınırla
      return Math.max(_internals.minScore, Math.min(_internals.maxScore, Math.round(rawScore)));
    } catch (err) {
      console.error("Standart skor hesaplama hatası:", err);
      return 50; // Hata durumunda orta bir değer döndür
    }
  }
  
  // Dışa açık API
  window.StrictScoreSystem = {
    // API Fonksiyonları
    initialize: initialize,
    cleanupResultScreens: cleanupResultScreens,
    calculateScore: calculateStandardScore,
    setRealScore: function(score) {
      _internals.realScore = score;
      window.realApiScore = score;
      dispatchScoreUpdateEvent(score);
      cleanupResultScreens();
    },
    
    // Yapılandırma
    config: {
      setScoreLimits: function(min, max) {
        _internals.minScore = min;
        _internals.maxScore = max;
      }
    }
  };
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', initialize);
})();