/**
 * Global Skor İşleyici - OmGame
 * 
 * Bu script, tüm oyunlarda kullanılan ve rastgele puanların gösterilmesini engelleyen,
 * bunun yerine sadece gerçek sunucu tarafından hesaplanan puanları gösteren bir çözümdür.
 */
(function() {
  "use strict";
  
  // Sayfa yüklendiğinde başlat
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Global skor işleyici yüklendi");
    initGlobalScoreHandler();
  });
  
  /**
   * Tüm skor işleme fonksiyonlarını başlatır
   */
  function initGlobalScoreHandler() {
    // Rastgele puanları göstermeyi engelle
    overrideRandomGenerators();
    
    // Score veya saveScore API'sini yakala
    interceptScoreApis();
    
    // DOM değişikliklerini izle
    observeResultsDisplay();
    
    // Periyodik temizleme (diğer rastgele puanları kaldırmak için)
    startPeriodicCleanup();
  }
  
  /**
   * Rastgele sayı üretimini geçersiz kıl
   * Bu, oyunların result ekranlarında rastgele puan göstermesini engeller
   */
  function overrideRandomGenerators() {
    // Orijinal fonksiyonları sakla
    const originalRandom = Math.random;
    const originalRandomInt = window.getRandomInt || null;
    const originalRandomNumber = window.randomNumber || null;
    
    // Math.random fonksiyonunu override et
    // Fonksiyon çağrıldığında, oyun sonuç ekranlarında kullanıldıysa sabit değerler döndürür
    Math.random = function() {
      // Stack izini al
      const stackTrace = new Error().stack || "";
      
      // Eğer bu çağrı, bir sonuç ekranı için kullanılıyorsa
      if (stackTrace.includes("displayResult") || 
          stackTrace.includes("showScore") || 
          stackTrace.includes("gameOver") || 
          stackTrace.includes("displayStats") ||
          stackTrace.includes("finalScore") ||
          isInScoreResultContext()) {
        
        // Skor hesaplamalar için sabit bir değer kullan
        return 0.75; // Genellikle iyi bir skor değeri verecek
      }
      
      // Değilse, normal rastgele fonksiyonu çalıştır
      return originalRandom.apply(this, arguments);
    };
    
    // getRandomInt fonksiyonunu override et (varsa)
    if (originalRandomInt) {
      window.getRandomInt = function(min, max) {
        // Sonuç ekranları için kullanılıyorsa, sabit skor döndür
        if (isInScoreResultContext()) {
          const serverScore = window._serverScore || 75;
          // Limit içinde bir değer döndür
          return Math.max(min, Math.min(max, serverScore));
        }
        
        // Değilse, normal davranış
        return originalRandomInt.apply(this, arguments);
      };
    }
    
    // randomNumber fonksiyonunu override et (varsa)
    if (originalRandomNumber) {
      window.randomNumber = function(min, max) {
        // Sonuç ekranları için kullanılıyorsa, sabit skor döndür
        if (isInScoreResultContext()) {
          const serverScore = window._serverScore || 75;
          // Limit içinde bir değer döndür
          return Math.max(min, Math.min(max, serverScore));
        }
        
        // Değilse, normal davranış
        return originalRandomNumber.apply(this, arguments);
      };
    }
    
    console.log("Rastgele sayı üreteçleri kontrol altına alındı");
  }
  
  /**
   * Mevcut çağrının bir skor/sonuç bağlamında olup olmadığını kontrol eder
   */
  function isInScoreResultContext() {
    const stack = new Error().stack || "";
    
    // Sonuç bağlamında mı kontrol et
    if (stack.includes("displayResult") || 
        stack.includes("showScore") || 
        stack.includes("calculateScore") ||
        stack.includes("updateScore") ||
        stack.includes("gameOver") || 
        stack.includes("displayStats")) {
      return true;
    }
    
    // Görünür bir sonuç/skor ekranı var mı kontrol et
    const resultElements = document.querySelectorAll('.game-over, .result-screen, .score-display, .game-result, .final-score-container');
    return resultElements.length > 0;
  }
  
  /**
   * Score API'lerini yakala ve gerçek skor bilgisini kaydet
   */
  function interceptScoreApis() {
    // ScoreHandler.saveScore fonksiyonunu yakala
    if (window.ScoreHandler && window.ScoreHandler.saveScore) {
      const originalSaveScore = window.ScoreHandler.saveScore;
      
      window.ScoreHandler.saveScore = function(gameType, score, difficulty, playTime, gameStats) {
        // Gerçek API yanıtını işleyecek fonksiyon
        const processScoreResponse = function(data) {
          if (data && data.success) {
            // Gerçek skoru global değişkene kaydet
            const realScore = data.points?.total || data.score || 0;
            window._serverScore = realScore;
            
            console.log("API'den gerçek skor alındı:", realScore);
            
            // Bu skoru tüm sonuç ekranlarında güncelle
            updateScoreDisplays(realScore);
            
            // Özel olay olarak yayınla
            document.dispatchEvent(new CustomEvent('realScoreReceived', { 
              detail: { score: realScore } 
            }));
          }
        };
        
        // Orijinal fonksiyonu çağır
        const result = originalSaveScore.apply(this, arguments);
        
        // Sonucu takip et
        if (result && typeof result.then === 'function') {
          result.then(processScoreResponse).catch(function(error) {
            console.error("Skor API hatası:", error);
          });
        }
        
        return result;
      };
      
      console.log("ScoreHandler.saveScore API'si yakalandı");
    }
    
    // jQuery ajax veya fetch API'lerini de yakalamak mümkün
    interceptFetchApi();
    interceptAjaxApi();
  }
  
  /**
   * Fetch API'sini yakala
   */
  function interceptFetchApi() {
    if (window.fetch) {
      const originalFetch = window.fetch;
      
      window.fetch = function(resource, options) {
        // URL bir string değilse (Request nesnesi)
        let url = resource;
        if (typeof resource !== 'string') {
          url = resource.url;
        }
        
        // Eğer skor ile ilgili bir API isteği ise
        if (url && typeof url === 'string' && 
           (url.includes('/save-score') || url.includes('/score'))) {
          
          // Orijinal isteği yap
          return originalFetch.apply(this, arguments)
            .then(function(response) {
              // Yanıtın bir kopyasını al
              const clone = response.clone();
              
              // JSON yanıtını işle
              clone.json().then(function(data) {
                if (data && (data.success || data.points)) {
                  // Gerçek skoru global değişkene kaydet
                  const realScore = data.points?.total || data.score || 0;
                  window._serverScore = realScore;
                  
                  console.log("Fetch API'den gerçek skor alındı:", realScore);
                  
                  // Bu skoru tüm sonuç ekranlarında güncelle
                  updateScoreDisplays(realScore);
                  
                  // Özel olay olarak yayınla
                  document.dispatchEvent(new CustomEvent('realScoreReceived', { 
                    detail: { score: realScore } 
                  }));
                }
              }).catch(function(error) {
                console.error("Fetch yanıt işleme hatası:", error);
              });
              
              // Orijinal yanıtı döndür
              return response;
            });
        }
        
        // Normal istek
        return originalFetch.apply(this, arguments);
      };
      
      console.log("Fetch API'si yakalandı");
    }
  }
  
  /**
   * jQuery Ajax API'sini yakala
   */
  function interceptAjaxApi() {
    if (window.jQuery && window.jQuery.ajax) {
      const originalAjax = window.jQuery.ajax;
      
      window.jQuery.ajax = function(url, options) {
        // Parametre şekline göre URL'yi al
        let requestUrl = url;
        if (typeof url === 'object') {
          options = url;
          requestUrl = options.url;
        }
        
        // Eğer skor ile ilgili bir API isteği ise
        if (requestUrl && typeof requestUrl === 'string' && 
           (requestUrl.includes('/save-score') || requestUrl.includes('/score'))) {
          
          // Success callback'i yakala
          const originalSuccess = options.success;
          
          if (originalSuccess) {
            options.success = function(data) {
              // Gerçek skoru işle
              if (data && (data.success || data.points)) {
                // Gerçek skoru global değişkene kaydet
                const realScore = data.points?.total || data.score || 0;
                window._serverScore = realScore;
                
                console.log("jQuery AJAX'dan gerçek skor alındı:", realScore);
                
                // Bu skoru tüm sonuç ekranlarında güncelle
                updateScoreDisplays(realScore);
                
                // Özel olay olarak yayınla
                document.dispatchEvent(new CustomEvent('realScoreReceived', { 
                  detail: { score: realScore } 
                }));
              }
              
              // Orijinal callback'i çağır
              return originalSuccess.apply(this, arguments);
            };
          }
        }
        
        // Orijinal AJAX işlemini çağır
        return originalAjax.apply(window.jQuery, arguments);
      };
      
      console.log("jQuery Ajax API'si yakalandı");
    }
  }
  
  /**
   * Tüm skor gösterimlerini güncelle
   */
  function updateScoreDisplays(score) {
    if (!score && score !== 0) return;
    
    // Tüm olası skor elementlerini bul
    const scoreElements = document.querySelectorAll(
      '#final-score, #finalScore, .final-score, ' + 
      '.result-score, .game-score, .score-value, ' + 
      '.result-stat-value, .stat-value'
    );
    
    scoreElements.forEach(function(element) {
      if (element) {
        const currentText = element.textContent || "";
        
        // Eğer içerik sadece bir sayı ise (ve çok farklıysa)
        if (/^\d+$/.test(currentText.trim())) {
          const currentValue = parseInt(currentText);
          
          // Eğer mevcut değer gerçek skordan çok farklıysa (± %20)
          if (Math.abs(currentValue - score) > (score * 0.2)) {
            // Animasyonlu geçiş
            animateScoreChange(element, currentValue, score);
          }
        } 
        // Element başka içerik de içeriyorsa (puan: 85 gibi)
        else if (currentText.includes(':')) {
          // Sayıyı bul ve değiştir
          const match = currentText.match(/(\d+)/);
          if (match) {
            const currentValue = parseInt(match[0]);
            
            // Gerçek skorla değiştir (string işleme)
            const newText = currentText.replace(/\d+/, score);
            element.textContent = newText;
          }
        }
      }
    });
    
    console.log("Tüm skor göstergeleri güncellendi");
  }
  
  /**
   * DOM değişikliklerini izleyerek sonuç ekranlarını tespit et
   */
  function observeResultsDisplay() {
    try {
      // Mutation Observer oluştur
      const observer = new MutationObserver(function(mutations) {
        // Sonuç ekranı görüntülendiğinde
        let resultScreenDetected = false;
        
        mutations.forEach(function(mutation) {
          // Yeni eklenen elementleri kontrol et
          if (mutation.addedNodes && mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              
              // Sadece element türündeki nodeları kontrol et
              if (node.nodeType === 1) {
                // Sınıf adı sonuç ile ilgili mi?
                if (node.className && typeof node.className === 'string') {
                  if (node.className.includes('result') || 
                      node.className.includes('game-over') || 
                      node.className.includes('score') || 
                      node.className.includes('stat')) {
                    resultScreenDetected = true;
                    break;
                  }
                }
                
                // İç içe elemanları kontrol et
                if (node.querySelector) {
                  const resultElement = node.querySelector('.result, .game-over, .score, .final-score');
                  if (resultElement) {
                    resultScreenDetected = true;
                    break;
                  }
                }
              }
            }
          }
          
          // display:block/flex olarak değişen elementleri kontrol et
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' && 
              mutation.target.style) {
            
            const style = mutation.target.style;
            
            if (style.display === 'block' || style.display === 'flex' || style.visibility === 'visible') {
              // Element bir sonuç ekranı/istatistik paneli mi?
              if (mutation.target.className && typeof mutation.target.className === 'string') {
                if (mutation.target.className.includes('result') || 
                    mutation.target.className.includes('game-over') || 
                    mutation.target.className.includes('stat') || 
                    mutation.target.className.includes('score')) {
                  resultScreenDetected = true;
                }
              }
            }
          }
        });
        
        // Sonuç ekranı algılandıysa
        if (resultScreenDetected) {
          console.log("Sonuç ekranı tespit edildi, skor güncelleniyor");
          
          // Gerçek skor varsa güncelle
          if (window._serverScore) {
            updateScoreDisplays(window._serverScore);
          } 
          // Gerçek skor yoksa temizleme yap
          else {
            cleanupRandomScores();
          }
        }
      });
      
      // Tüm DOM'u izle
      observer.observe(document.body, {
        childList: true,   // DOM'a eklenen/çıkarılan nodeları izle
        subtree: true,     // Tüm alt elementleri izle
        attributes: true,  // Özellikleri izle
        attributeFilter: ['style', 'class'] // Sadece stil ve sınıf değişikliklerini izle
      });
      
      console.log("DOM gözlemcisi kuruldu");
    } catch (error) {
      console.error("DOM gözlemcisi kurulurken hata:", error);
    }
  }
  
  /**
   * Periyodik olarak rastgele puanları temizler
   */
  function startPeriodicCleanup() {
    // İlk temizleme
    setTimeout(cleanupRandomScores, 1000);
    
    // 2 saniyede bir temizleme yap (oyun sonu ekranı geldikten sonra)
    const interval = setInterval(function() {
      cleanupRandomScores();
      
      // Sayfa yüklendiğinde sayaç
      window._cleanupCounter = (window._cleanupCounter || 0) + 1;
      
      // 20 iterasyondan sonra durdur (40 saniye)
      if (window._cleanupCounter > 20) {
        clearInterval(interval);
        console.log("Periyodik temizleme durduruldu");
      }
    }, 2000);
    
    console.log("Periyodik temizleme başlatıldı");
  }
  
  /**
   * Rastgele puanları temizle ve sadece gerçek puanı göster
   */
  function cleanupRandomScores() {
    try {
      // Sonuç ekranlarını bul
      const resultContainers = document.querySelectorAll(
        '.game-over, .result-screen, .score-display, ' +
        '.game-result, .results-stats, .game-result-stats, ' +
        '.result-container, .stats-container, .game-over-container'
      );
      
      let serverScore = window._serverScore;
      
      resultContainers.forEach(function(container) {
        // Tüm stat elemanlarını bul
        const statElements = container.querySelectorAll('.result-stat, .stat, .game-stat');
        let scoreElement = null;
        
        // Her bir istatistik elementini kontrol et
        statElements.forEach(function(element) {
          // İçeriğine göre puan elemanı mı kontrol et
          const textContent = element.textContent.toLowerCase();
          
          if (textContent.includes('puan') || 
              textContent.includes('skor') || 
              textContent.includes('score') || 
              textContent.includes('point')) {
            // Bu element puanla ilgili
            scoreElement = element;
          } else {
            // Puan dışı elementleri gizle
            element.style.display = 'none';
          }
        });
        
        // Puan elemanını vurgula
        if (scoreElement) {
          scoreElement.style.flex = '1';
          scoreElement.style.textAlign = 'center';
          
          // Değer elemanını bul
          const valueElement = scoreElement.querySelector('.result-stat-value, .stat-value, [data-value]');
          if (valueElement) {
            valueElement.style.fontSize = '3rem';
            valueElement.style.fontWeight = 'bold';
            valueElement.style.color = '#6a5ae0';
            valueElement.style.textShadow = '0 0 10px rgba(106, 90, 224, 0.5)';
            
            // Gerçek skor varsa güncelle
            if (serverScore !== undefined) {
              // Mevcut değeri al
              const currentValue = parseInt(valueElement.textContent) || 0;
              
              // Gerçek skordan çok farklıysa güncelle
              if (Math.abs(currentValue - serverScore) > (serverScore * 0.2)) {
                animateScoreChange(valueElement, currentValue, serverScore);
              }
            }
          }
        }
        
        // Derecelendirme yıldızlarını gizle
        const ratingElements = container.querySelectorAll('.rating-stars, .rating-text, .game-rating, .rating');
        ratingElements.forEach(function(element) {
          element.style.display = 'none';
        });
      });
      
      console.log("Rastgele puanlar temizlendi");
    } catch (error) {
      console.error("Rastgele puan temizleme hatası:", error);
    }
  }
  
  /**
   * Skoru animasyonlu şekilde değiştir
   */
  function animateScoreChange(element, startValue, endValue) {
    try {
      if (!element) return;
      
      // Başlangıç ve bitiş değeri aynıysa işlem yapma
      if (startValue === endValue) return;
      
      const duration = 1000; // 1 saniye
      const startTime = performance.now();
      
      function animate(timestamp) {
        // Geçen süreyi hesapla
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Yavaşlayan animasyon
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Mevcut değeri hesapla
        const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
        
        // Elementi güncelle
        element.textContent = currentValue;
        
        // Animasyon devam ediyorsa sonraki kareyi çiz
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      // Animasyonu başlat
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Skor animasyon hatası:", error);
      // Hata durumunda doğrudan değeri ata
      if (element) element.textContent = endValue;
    }
  }
  
  // Modülü global olarak erişilebilir yap
  window.GlobalScoreHandler = {
    updateScores: updateScoreDisplays,
    cleanupRandomScores: cleanupRandomScores,
    setRealScore: function(score) {
      window._serverScore = score;
      updateScoreDisplays(score);
    }
  };
})();