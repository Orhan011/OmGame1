/**
 * StrictScoreHandler: Kesin Puan Kontrol Sistemi
 * 
 * Bu modül, tüm oyunlarda rastgele puan üretimini engeller ve
 * sadece API'den gelen gerçek skorların kullanılmasını sağlar.
 * 
 * Özellikler:
 * - Tüm Math.random() çağrılarını izler ve skor hesaplamalarında kullanıldığında geçersiz kılar
 * - DOM'a eklenen tüm skor/istatistik elementlerini tespit eder ve düzenler
 * - Tüm oyunlarda 10-100 arası skor sınırlamasını uygular
 * - Her zaman API yanıtından gelen doğrulanmış skorları kullanır
 */
(function() {
  "use strict";
  
  // ScoreResult sınıfı: API'den alınan gerçek skor bilgilerini tutar
  class ScoreResult {
    constructor(score = null) {
      this.realScore = score;        // API'den dönen gerçek skor
      this.realScoreFuture = null;   // Henüz tamamlanmamış API çağrısı için Promise
      this.locked = false;           // Skor kilidi (rastgele değerleri engeller)
      this.minScore = 10;            // Minimum skor sınırı
      this.maxScore = 100;           // Maksimum skor sınırı
      this.defaultScore = 75;        // Varsayılan skor (gerçek skor yoksa)
      this.waitingElements = [];     // Güncelleme bekleyen elementler
    }
    
    // Gerçek skoru ayarla
    setRealScore(score) {
      if (typeof score === 'number' && score >= 0) {
        // Skor sınırlarını uygula
        this.realScore = Math.max(this.minScore, Math.min(this.maxScore, score));
        // Kilit durumunu aktifleştir
        this.locked = true;
        // Bekleyen tüm elementleri güncelle
        this.updateWaitingElements();
        
        console.log("✅ Gerçek skor ayarlandı:", this.realScore);
        return true;
      }
      return false;
    }
    
    // Gerçek skoru al (yoksa varsayılan değer döndür)
    getRealScore() {
      return this.realScore !== null ? this.realScore : this.defaultScore;
    }
    
    // Bekleyen bir element ekle
    addWaitingElement(element, currentValue) {
      if (element && element.nodeType === 1) {
        this.waitingElements.push({element, currentValue});
        
        // Gerçek skor zaten varsa hemen güncelle
        if (this.realScore !== null) {
          this.updateElement(element, currentValue, this.realScore);
        }
      }
    }
    
    // Tüm bekleyen elementleri güncelle
    updateWaitingElements() {
      if (this.realScore === null) return;
      
      this.waitingElements.forEach(item => {
        this.updateElement(item.element, item.currentValue, this.realScore);
      });
      
      // Liste temizle
      this.waitingElements = [];
    }
    
    // Bir elementi gerçek skorla güncelle (animasyonlu)
    updateElement(element, currentValue, newValue) {
      if (!element || !element.nodeType) return;
      
      try {
        // Sayısal değerler değilse dönüştür
        currentValue = parseInt(currentValue) || 0;
        newValue = parseInt(newValue);
        
        // Animasyonlu geçiş
        const duration = 1200; // 1.2 saniye
        const startTime = performance.now();
        
        const updateFrame = (timestamp) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Yavaşlatılmış hareket (easing)
          const easing = 1 - Math.pow(1 - progress, 3);
          
          // Mevcut değeri hesapla
          const current = Math.round(currentValue + (newValue - currentValue) * easing);
          
          // Element içeriğini güncelle
          element.textContent = current;
          
          // Animasyon devam ediyorsa, bir sonraki kareyi çiz
          if (progress < 1) {
            requestAnimationFrame(updateFrame);
          }
        };
        
        // Animasyonu başlat
        requestAnimationFrame(updateFrame);
      } catch (error) {
        console.error("Element güncelleme hatası:", error);
        // Hata durumunda direk değeri ata
        element.textContent = newValue;
      }
    }
  }
  
  // Ana ScoreOverride sınıfı: Tüm puan işlemlerini kontrol eder
  class ScoreOverride {
    constructor() {
      // Gerçek skor bilgisi
      this.scoreResult = new ScoreResult();
      
      // Orijinal fonksiyonları sakla
      this.originalRandom = Math.random;
      this.originalFloor = Math.floor;
      this.originalRound = Math.round;
      this.originalCeil = Math.ceil;
      
      // İzleme durumu
      this.monitoringActive = false;
      this.cleanupCounter = 0;
      this.mutationObserver = null;
      
      // Selektörler
      this.resultSelectors = [
        '.result-screen', '.game-over', '.score-display', 
        '.results-stats', '.game-result-stats', '.game-stats',
        '.result-container', '.stats-container', '.game-over-container'
      ];
      
      this.scoreSelectors = [
        '#final-score', '.final-score', '#finalScore', 
        '.game-result-score', '.result-score', '.score-value',
        '.score-display', '.total-score', '[id$="-score"]'
      ];
      
      // Skorlar için maksimum ve minimum değerler
      this.scoreRange = {
        min: 10,   // Minimum skor
        max: 100,  // Maksimum skor
        default: 75  // Varsayılan skor (API sonucu yoksa)
      };
      
      // İzlenen fonksiyon çağrıları
      this.monitoredCalls = {
        random: 0,
        floor: 0,
        round: 0,
        ceil: 0
      };
    }
    
    // Başlangıç - tüm işlemleri başlatır
    init() {
      console.log("🔒 StrictScoreHandler başlatılıyor...");
      
      // Math.random ve diğer fonksiyonları kontrol altına al
      this.overrideMathFunctions();
      
      // API listener'ları ekle
      this.setupApiListeners();
      
      // DOM'u izle
      this.observeDOM();
      
      // Periyodik temizleme başlat
      this.startPeriodicCleanup();
      
      console.log("✅ StrictScoreHandler başlatıldı");
    }
    
    // Math fonksiyonlarını override et
    overrideMathFunctions() {
      try {
        // Math.random override - score hesaplamalarında sabit değer döndürür
        Math.random = (...args) => {
          this.monitoredCalls.random++;
          
          // Eğer bu çağrı skor/puan hesaplaması ile ilgiliyse
          if (this.isScoreCalculationContext()) {
            // Kilitleme aktifse özel değer döndür
            if (this.scoreResult.locked) {
              return this.safeRandom(0.75);
            }
          }
          
          // Normal davranış
          return this.originalRandom.apply(Math, args);
        };
        
        // Math.floor override
        Math.floor = (value) => {
          this.monitoredCalls.floor++;
          
          // Eğer skor hesaplamasıysa ve skor kilidi aktifse
          if (this.isScoreCalculationContext() && this.scoreResult.locked) {
            // Gerçek skoru döndür (API'den gelen)
            if (this.isScoreValue(value)) {
              return this.applySafeScore(value);
            }
          }
          
          return this.originalFloor.call(Math, value);
        };
        
        // Math.round override
        Math.round = (value) => {
          this.monitoredCalls.round++;
          
          // Eğer skor hesaplamasıysa ve skor kilidi aktifse
          if (this.isScoreCalculationContext() && this.scoreResult.locked) {
            // Gerçek skoru döndür (API'den gelen)
            if (this.isScoreValue(value)) {
              return this.applySafeScore(value);
            }
          }
          
          return this.originalRound.call(Math, value);
        };
        
        // Math.ceil override
        Math.ceil = (value) => {
          this.monitoredCalls.ceil++;
          
          // Eğer skor hesaplamasıysa ve skor kilidi aktifse
          if (this.isScoreCalculationContext() && this.scoreResult.locked) {
            // Gerçek skoru döndür (API'den gelen)
            if (this.isScoreValue(value)) {
              return this.applySafeScore(value);
            }
          }
          
          return this.originalCeil.call(Math, value);
        };
        
        console.log("✅ Math fonksiyonları kontrol altına alındı");
      }
      catch (error) {
        console.error("❌ Math fonksiyonları override edilirken hata:", error);
      }
    }
    
    // Belirli bir değeri sınırlar içerisinde döndürür
    safeRandom(defaultValue = 0.5) {
      return defaultValue;
    }
    
    // Bir değerin skor değeri olup olmadığını kontrol eder
    isScoreValue(value) {
      // Değer sayısal olmalı
      if (typeof value !== 'number') return false;
      
      // Değer 0-1000 arasında olmalı (tipik skor aralığı)
      if (value < 0 || value > 1000) return false;
      
      // Stack trace kontrolü
      const stack = new Error().stack || "";
      return stack.includes('score') || 
             stack.includes('point') || 
             stack.includes('result') || 
             stack.includes('game');
    }
    
    // Skor değerini güvenli aralıklara alır
    applySafeScore(value) {
      // Gerçek skor varsa onu döndür
      if (this.scoreResult.realScore !== null) {
        return this.scoreResult.realScore;
      }
      
      // Değeri aralık içerisine al
      return Math.max(
        this.scoreRange.min, 
        Math.min(this.scoreRange.max, 
                Math.round(value)
        )
      );
    }
    
    // Çağrı bağlamının skor hesaplaması olup olmadığını kontrol eder
    isScoreCalculationContext() {
      try {
        // Stack trace al
        const stack = new Error().stack || "";
        
        // Skor ile ilgili anahtar kelimeleri kontrol et
        return stack.includes('score') || 
               stack.includes('point') || 
               stack.includes('calculateScore') || 
               stack.includes('getScore') || 
               stack.includes('updateScore') || 
               stack.includes('showResult') || 
               stack.includes('gameOver') || 
               stack.includes('displayStats') ||
               stack.includes('displayResult') ||
               stack.includes('finalScore');
      }
      catch (error) {
        return false;
      }
    }
    
    // Score API dinleyicilerini ayarla
    setupApiListeners() {
      try {
        // ScoreHandler.saveScore metodunu yakala
        if (window.ScoreHandler && typeof window.ScoreHandler.saveScore === 'function') {
          const originalSaveScore = window.ScoreHandler.saveScore;
          
          window.ScoreHandler.saveScore = (...args) => {
            // Orijinal metodu çağır
            const result = originalSaveScore.apply(window.ScoreHandler, args);
            
            // Gerçek skoru kaydet (Promise dönüyorsa)
            if (result && typeof result.then === 'function') {
              result.then(data => {
                if (data && data.success) {
                  // Gerçek skoru al - öncelikle 'points.total', yoksa 'score'
                  const score = data.points?.total || data.score || args[1] || null;
                  
                  // Skoru ayarla
                  if (score !== null) {
                    this.scoreResult.setRealScore(score);
                    console.log("✅ API'den gerçek skor alındı:", score);
                    
                    // Temizleme fonksiyonunu çağır
                    this.cleanupAllResults();
                  }
                }
              }).catch(error => {
                console.error("❌ API skoru alınırken hata:", error);
              });
            }
            
            return result;
          };
          
          console.log("✅ ScoreHandler.saveScore metodu yakalandı");
        }
        
        // Custom event dinleyicisi ekle
        document.addEventListener('scoreApiResponse', event => {
          if (event.detail && event.detail.data) {
            const data = event.detail.data;
            const score = data.points?.total || data.score || null;
            
            if (score !== null) {
              this.scoreResult.setRealScore(score);
              console.log("✅ scoreApiResponse event'inden skor alındı:", score);
              
              // Temizleme fonksiyonunu çağır
              this.cleanupAllResults();
            }
          }
        });
        
        // Fetch API override
        this.interceptFetchAPI();
        
        // XMLHttpRequest override
        this.interceptXHR();
        
        console.log("✅ API dinleyicileri kuruldu");
      }
      catch (error) {
        console.error("❌ API dinleyicileri kurulurken hata:", error);
      }
    }
    
    // Fetch API'yi yakala
    interceptFetchAPI() {
      if (window.fetch) {
        const originalFetch = window.fetch;
        
        window.fetch = (resource, options) => {
          // URL'yi al
          let url = '';
          if (typeof resource === 'string') {
            url = resource;
          } else if (resource instanceof Request) {
            url = resource.url;
          }
          
          // Skor API endpoint'i mi kontrol et
          if (url.includes('/save-score') || url.includes('/api/save-score')) {
            const fetchPromise = originalFetch(resource, options);
            
            return fetchPromise.then(response => {
              // Yanıtın bir klonunu al (okuma sonrası body tüketilmesin)
              const clone = response.clone();
              
              // Yanıtı işle
              clone.json().then(data => {
                if (data && data.success) {
                  // Gerçek skoru al
                  const score = data.points?.total || data.score || null;
                  
                  if (score !== null) {
                    this.scoreResult.setRealScore(score);
                    console.log("✅ Fetch API'den gerçek skor alındı:", score);
                    
                    // Temizleme fonksiyonunu çağır
                    this.cleanupAllResults();
                  }
                }
              }).catch(error => {
                console.error("❌ Fetch yanıtı işlenirken hata:", error);
              });
              
              return response;
            });
          }
          
          // Normal fetch işlemini yap
          return originalFetch(resource, options);
        };
        
        console.log("✅ Fetch API yakalandı");
      }
    }
    
    // XMLHttpRequest'i yakala
    interceptXHR() {
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      const self = this;
      
      XMLHttpRequest.prototype.open = function(method, url, ...args) {
        // URL'yi sakla
        this._url = url;
        return originalXHROpen.apply(this, [method, url, ...args]);
      };
      
      XMLHttpRequest.prototype.send = function(...args) {
        // Skor ile ilgili bir API çağrısı mı kontrol et
        if (this._url && (this._url.includes('/save-score') || this._url.includes('/api/save-score'))) {
          // Load event dinleyicisi ekle
          this.addEventListener('load', function() {
            try {
              if (this.responseText) {
                const data = JSON.parse(this.responseText);
                
                if (data && data.success) {
                  // Gerçek skoru al
                  const score = data.points?.total || data.score || null;
                  
                  if (score !== null) {
                    self.scoreResult.setRealScore(score);
                    console.log("✅ XHR'dan gerçek skor alındı:", score);
                    
                    // Temizleme fonksiyonunu çağır
                    self.cleanupAllResults();
                  }
                }
              }
            } catch (error) {
              console.error("❌ XHR yanıtı işlenirken hata:", error);
            }
          });
        }
        
        return originalXHRSend.apply(this, args);
      };
      
      console.log("✅ XMLHttpRequest yakalandı");
    }
    
    // DOM değişikliklerini gözlemle
    observeDOM() {
      try {
        // Önce gözlemciyi temizle
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }
        
        // Yeni MutationObserver oluştur
        this.mutationObserver = new MutationObserver(mutations => {
          let shouldProcessResults = false;
          
          // Her bir mutasyonu kontrol et
          mutations.forEach(mutation => {
            // Yeni eklenen elemanları kontrol et
            if (mutation.addedNodes && mutation.addedNodes.length) {
              for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                
                // Sadece elementlerle ilgilen
                if (node.nodeType !== 1) continue;
                
                // Skor/sonuç ekranı mı kontrol et
                if (this.isResultNode(node)) {
                  shouldProcessResults = true;
                  break;
                }
              }
            }
            
            // display/visibility değişikliklerini kontrol et
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' && 
                mutation.target.style) {
              
              const display = mutation.target.style.display;
              const visibility = mutation.target.style.visibility;
              
              // Element görünür hale geldiyse
              if ((display === 'block' || display === 'flex' || display !== 'none') && 
                  (visibility === 'visible' || visibility !== 'hidden')) {
                
                // Sonuç ekranı mı kontrol et
                if (this.isResultNode(mutation.target)) {
                  shouldProcessResults = true;
                }
              }
            }
          });
          
          // Sonuç ekranı değişiklikleri varsa işle
          if (shouldProcessResults) {
            this.cleanupAllResults();
          }
        });
        
        // DOM'un tamamını izle
        this.mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'id']
        });
        
        console.log("✅ DOM izleyicisi başlatıldı");
        return true;
      }
      catch (error) {
        console.error("❌ DOM izleyicisi başlatılırken hata:", error);
        return false;
      }
    }
    
    // Bir elementin sonuç/istatistik ekranı olup olmadığını kontrol eder
    isResultNode(node) {
      if (!node || !node.nodeType) return false;
      
      try {
        // Element class/id kontrolü
        if (node.className && typeof node.className === 'string') {
          const classStr = node.className.toLowerCase();
          
          if (classStr.includes('result') || 
              classStr.includes('score') || 
              classStr.includes('stat') || 
              classStr.includes('game-over')) {
            return true;
          }
        }
        
        // ID kontrolü
        if (node.id && typeof node.id === 'string') {
          const idStr = node.id.toLowerCase();
          
          if (idStr.includes('result') || 
              idStr.includes('score') || 
              idStr.includes('stat') || 
              idStr.includes('game-over')) {
            return true;
          }
        }
        
        // Özel selektörlerle sorgula
        for (const selector of this.resultSelectors) {
          if (node.matches && node.matches(selector)) {
            return true;
          }
        }
        
        // İç içe sonuç elemanları kontrolü
        if (node.querySelector) {
          for (const selector of this.resultSelectors) {
            if (node.querySelector(selector)) {
              return true;
            }
          }
        }
      }
      catch (error) {
        console.error("❌ Element kontrolü sırasında hata:", error);
      }
      
      return false;
    }
    
    // Periyodik temizleme başlat
    startPeriodicCleanup() {
      // İlk temizleme
      setTimeout(() => this.cleanupAllResults(), 1000);
      
      // Periyodik temizleme (her 1.5 saniyede bir)
      const interval = setInterval(() => {
        this.cleanupCounter++;
        this.cleanupAllResults();
        
        // 30 kez temizledikten sonra durdur (performans için)
        if (this.cleanupCounter > 30) {
          clearInterval(interval);
          console.log("✓ Periyodik temizleme durduruldu (30 iterasyon tamamlandı)");
        }
      }, 1500);
      
      console.log("✅ Periyodik temizleme başlatıldı");
    }
    
    // Tüm sonuç ekranlarını temizler ve gerçek skorlarla günceller
    cleanupAllResults() {
      try {
        // Sonuç konteynerlerini bul
        const resultContainers = document.querySelectorAll(this.resultSelectors.join(', '));
        
        // Her bir konteyner için
        resultContainers.forEach(container => {
          this.cleanResultContainer(container);
        });
        
        // Tekil skor elementlerini güncelle
        this.updateAllScoreElements();
        
        // Yıldız derecelendirmelerini gizle
        this.hideRatingElements();
        
        return true;
      }
      catch (error) {
        console.error("❌ Sonuç ekranları temizlenirken hata:", error);
        return false;
      }
    }
    
    // Bir sonuç konteynerini temizler
    cleanResultContainer(container) {
      if (!container) return false;
      
      try {
        // Bu konteyner daha önce temizlendi mi?
        if (container.hasAttribute('data-score-cleaned')) {
          return true;
        }
        
        // İstatistik elementlerini bul
        const statElements = container.querySelectorAll('.stat, .result-stat, .game-stat, [class*="stat-"], [class*="score-"]');
        let scoreElement = null;
        
        // Her bir istatistik elementi için
        for (let i = 0; i < statElements.length; i++) {
          const element = statElements[i];
          const text = element.textContent.toLowerCase();
          
          // Skor/puan içeriyor mu?
          if (text.includes('puan') || 
              text.includes('skor') || 
              text.includes('score') || 
              text.includes('point')) {
            // Bu, skor elementi
            scoreElement = element;
          } else {
            // Puanla ilgili olmayan istatistikleri gizle
            element.style.display = 'none';
          }
        }
        
        // Skor elementi bulunduysa düzenle
        if (scoreElement) {
          // Stil düzenlemeleri
          scoreElement.style.display = 'flex';
          scoreElement.style.flexDirection = 'column';
          scoreElement.style.alignItems = 'center';
          scoreElement.style.justifyContent = 'center';
          scoreElement.style.width = '100%';
          scoreElement.style.margin = '20px auto';
          scoreElement.style.textAlign = 'center';
          
          // Skor değerini içeren elementi bul
          const valueElement = scoreElement.querySelector('.result-stat-value, .stat-value, .score-value, [data-value]');
          
          if (valueElement) {
            // Stil düzenlemeleri
            valueElement.style.fontSize = '3.5rem';
            valueElement.style.fontWeight = 'bold';
            valueElement.style.color = '#4a67e8';
            valueElement.style.textShadow = '0 0 10px rgba(74, 103, 232, 0.5)';
            valueElement.style.padding = '15px 0';
            
            // Mevcut değeri al
            const currentValue = parseInt(valueElement.textContent) || 0;
            
            // Gerçek skorla güncelle (veya değeri beklemek üzere kaydet)
            if (this.scoreResult.realScore !== null) {
              this.scoreResult.updateElement(valueElement, currentValue, this.scoreResult.realScore);
            } else {
              // Henüz gerçek skor yoksa elementi kaydet, skor geldiğinde güncellenecek
              this.scoreResult.addWaitingElement(valueElement, currentValue);
            }
          }
          
          // Etiket elementini bul
          const labelElement = scoreElement.querySelector('.result-stat-label, .stat-label');
          if (labelElement) {
            labelElement.style.fontSize = '1.2rem';
            labelElement.style.fontWeight = 'bold';
            labelElement.style.marginBottom = '10px';
          }
        }
        
        // Bu konteyner temizlendi olarak işaretle
        container.setAttribute('data-score-cleaned', 'true');
        return true;
      }
      catch (error) {
        console.error("❌ Sonuç konteyneri temizlenirken hata:", error, container);
        return false;
      }
    }
    
    // Tüm skor elementlerini günceller
    updateAllScoreElements() {
      try {
        // Final skor elementlerini bul
        const scoreElements = document.querySelectorAll(this.scoreSelectors.join(', '));
        
        // Her bir element için
        scoreElements.forEach(element => {
          if (!element) return;
          
          // Stil düzenlemeleri
          element.style.fontSize = '3rem';
          element.style.fontWeight = 'bold';
          element.style.color = '#4a67e8';
          element.style.textShadow = '0 0 10px rgba(74, 103, 232, 0.3)';
          
          // Mevcut değeri al
          const currentValue = parseInt(element.textContent) || 0;
          
          // Gerçek skorla güncelle (veya değeri beklemek üzere kaydet)
          if (this.scoreResult.realScore !== null) {
            this.scoreResult.updateElement(element, currentValue, this.scoreResult.realScore);
          } else {
            // Henüz gerçek skor yoksa elementi kaydet, skor geldiğinde güncellenecek
            this.scoreResult.addWaitingElement(element, currentValue);
          }
        });
        
        return true;
      }
      catch (error) {
        console.error("❌ Skor elementleri güncellenirken hata:", error);
        return false;
      }
    }
    
    // Derecelendirme elementlerini gizler
    hideRatingElements() {
      try {
        // Derecelendirme elementlerini bul
        const ratingElements = document.querySelectorAll(
          '.rating, .rating-stars, .rating-container, ' +
          '.star-rating, [class*="rating-"], #rating-stars, ' +
          '[id*="rating"], .stars-container'
        );
        
        // Her birini gizle
        ratingElements.forEach(element => {
          element.style.display = 'none';
        });
        
        return true;
      }
      catch (error) {
        console.error("❌ Derecelendirme elementleri gizlenirken hata:", error);
        return false;
      }
    }
  }
  
  // Singletion instance
  const scoreController = new ScoreOverride();
  
  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scoreController.init());
  } else {
    // Sayfa zaten yüklendiyse hemen başlat
    scoreController.init();
  }
  
  // Global erişim
  window.StrictScoreHandler = {
    // Gerçek skoru manuel olarak ayarla
    setRealScore: function(score) {
      return scoreController.scoreResult.setRealScore(score);
    },
    
    // Tüm sonuç ekranlarını temizle
    cleanupResults: function() {
      return scoreController.cleanupAllResults();
    },
    
    // Skor aralığını değiştir
    setScoreRange: function(min, max) {
      if (typeof min === 'number' && typeof max === 'number' && min < max) {
        scoreController.scoreRange.min = min;
        scoreController.scoreRange.max = max;
        return true;
      }
      return false;
    }
  };
})();